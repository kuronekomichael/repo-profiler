var GitHubAPI = require('./lib/githubApi');
var adjudicator = require('./lib/adjudicator');
var colors = require('colors');
var Promise = require('bluebird');
var path = require('path');
var fs = require('fs-extra');
var repos = require('./repos');

function subscribe(repos, cb) {
    var data = {
        pullRequests: [],
        comments: []
    };

    var api = new GitHubAPI();

    if (process.env.GITHUB_HOST) {
        api.setHost(process.env.GITHUB_HOST);
    }
    if (process.env.GITHUB_USER && process.env.GITHUB_TOKEN) {
        api.setAuth(process.env.GITHUB_USER, process.env.GITHUB_TOKEN);
    }

    Promise.all(repos.map(function(repo) {
        return new Promise(function(onFulfilled, onRejected) {
            api.getPullRequests(repo, function(err, json) {
                if (err) {
                    onRejected(err);
                    return;
                }
                onFulfilled(json);
            });
        });
    })).then(function(results) {
        // create PullRequest's List
        var pullRequests = [];
        results.forEach(function(list) {
            list.forEach(function(pullRequest) {
                if (!pullRequest.user) {
                    // user情報が無い=退会済みユーザのPRは除外する
                    return;
                }
                pullRequests.push(pullRequest);

                data.pullRequests.push({
                    id: pullRequest.id,                     // PR Identifier
                    user: pullRequest.user.login,           // 起票者
                    repo: pullRequest.base.repo.full_name,  // リポジトリ
                    created_at: pullRequest.created_at      // 起票日
                });
            });
        });

        return Promise.all(pullRequests.map(function(pullRequest) {
            return new Promise(function(onFulfilled, onRejected) {
                api.getComments(pullRequest.comments_url, function(err, comments) {
                    if (err) {
                        onRejected(err);
                        return;
                    }
                    comments.forEach(function(comment) {
                        comment.pr_user = pullRequest.user.login;
                        comment.repo_name = pullRequest.base.repo.full_name;
                    });
                    onFulfilled(comments);
                });
            });
        }));
    }).then(function(results) {
        results.forEach(function(comments) {
            comments.forEach(function(comment) {
                // PullRequest起票者自身がコメントしたものはカウントしない
                if (comment.user.login === comment.pr_user) {
                    return;
                }
                data.comments.push({
                    id: comment.id,                 // Comment Identifier
                    user: comment.user.login,       // コメンター
                    body: comment.body,             // コメント本文
                    repo: comment.repo_name,        // リポジトリ
                    created_at: comment.created_at  // コメント日時
                });
            });
        });
        //fs.writeFileSync('data.json', JSON.stringify(data));
        cb(data);
    });
}

function makeJsonFile(data, outputDir) {

    if (fs.existsSync(outputDir)) {
        fs.removeSync(outputDir);
    }
    fs.mkdirSync(outputDir);

    var dataTable = makeDataInOrderOfDate(data);

    // 日付をソート
    var keyList = [];
    for (var key in dataTable) {
        keyList.push(key);
    }
    keyList.sort();

    var awards = keyList.map(function(key) {
        var thisMonthPRs = dataTable[key].pullRequests;
        var thisMonthComments = dataTable[key].comments;

        var award = {
            label: key,
            mpp: adjudicator.judgeMostPullRequestPersonAward(thisMonthPRs),
            mpr: adjudicator.judgeMostPullRequestRepositoryAward(thisMonthPRs),
            mcp: adjudicator.judgeMostCommentPersonAward(thisMonthComments),
            mcr: adjudicator.judgeMostCommentRepositoryAward(thisMonthComments)
        };

        fs.writeFileSync(path.join(outputDir, award.label + '.json'), JSON.stringify(award));

        return award;
    });

    fs.writeFileSync(path.join(outputDir, 'labels.json'), JSON.stringify(keyList));
}

/**
 * makeDataInOrderOfDate 日付毎にデータを整頓して返す
 * @param data
 *     PRとCommentに分類されたデータ
 *     { pullRequest: [{}, ...], comments: [{}, ...]}
 * @return dataTable
 *    日付毎に分類されたデータ
 *    {
 *      '2014-01': { pullRequests: [{}, ...], comments: [{}, ...]},
 *      ...
 *    }
 */
function makeDataInOrderOfDate(data) {
    function getDateLabel(dateString) {
        var date = new Date(dateString);
        var month = date.getMonth() + 1;
        month = month >= 10 ? month : '0' + month;
        var year = date.getYear() + 1900;
        return year + '-' + month;
    }

    var dataTable = {};
    data.pullRequests.forEach(function(data) {
        var key = getDateLabel(data.created_at);
        if (!dataTable[key]) {
            dataTable[key] = {
                pullRequests: [],
                comments: []
            };
        }
        dataTable[key].pullRequests.push(data);
    });
    data.comments.forEach(function(data) {
        var key = getDateLabel(data.created_at);
        if (!dataTable[key]) {
            dataTable[key] = {
                pullRequests: [],
                comments: []
            };
        }
        dataTable[key].comments.push(data);
    });
    return dataTable;
}

// GithubAPIを使ってプルリとコメントを全取得
subscribe(repos, function(data) {
    // 日付毎にファイルを分けて、JSONファイルに書き出す
    makeJsonFile(data, '../data');
    console.log('finished.');
});
