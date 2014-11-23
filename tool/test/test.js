var adjudicator = require('../lib/adjudicator');
var GitHubAPI = require('../lib/githubApi');
var colors = require('colors');
var Promise = require('bluebird');
var fs = require('fs');

describe('GitHubAPI all comment', function() {

    before(function(){
        this.api = new GitHubAPI(process.env.GITHUB_HOST);
        this.api.authenticate(process.env.GITHUB_USER, process.env.GITHUB_TOKEN);
    });

    it('getPullRequests', function(done) {
        var that = this;

        expect(that.api).to.be.ok;

        that.api.getPullRequests('SFTtech/openage', function(err, pulls) {
            expect(err).to.be.null;
            expect(pulls).to.be.ok;
            //expect(pulls.length).to.be.equals(41);
            //that.pr = pulls[10];
            pulls.forEach(function(pr) {
                if (pr.number === 150) {
                    that.pr = pr;
                }
                //console.log(pr);
            });
            done();
        });
    });

    it('getComments', function(done) {
        var that = this;

        expect(this.api).to.be.ok;
        var total = 0;

        that.api.getComments(that.pr.comments_url, function(err, comments) {
            expect(err).to.be.null;
            expect(comments).to.be.ok;
            //console.log(comments.length);
            total += comments.length;
            that.api.getComments(that.pr.review_comments_url, function(err, reviewComments) {
                //console.log(reviewComments.length);
                total += reviewComments.length;

                expect(total).to.be.equals(31);
                done();
            });
        });
    });
});

describe('GitHubAPI', function() {

    before(function(){
        this.api = new GitHubAPI(process.env.GITHUB_HOST);
        this.api.authenticate(process.env.GITHUB_USER, process.env.GITHUB_TOKEN);
    });

    it('getPullRequests', function(done) {
        var that = this;

        expect(that.api).to.be.ok;

        that.api.getPullRequests('OpenKinect/libfreenect2', function(err, json) {
            expect(err).to.be.null;
            expect(json).to.be.ok;
            expect(json.length).to.be.equals(41);
            that.pr = json[10];
            done();
        });
    });

    it('getComments', function(done) {
        expect(this.api).to.be.ok;

        this.api.getComments(this.pr.comments_url, function(err, json) {
            expect(err).to.be.null;
            expect(json).to.be.ok;
            expect(json.length).to.be.equals(6);
            done();
        });
    });

});

describe('GitHubAPI-Promise', function() {

    before(function(){
        this.api = new GitHubAPI(process.env.GITHUB_HOST);
        this.api.authenticate(process.env.GITHUB_USER, process.env.GITHUB_TOKEN);
    });

    it('getPullRequestsAndComments', function(done) {
        var that = this;

        var repos = [
            'OpenKinect/libfreenect2',
            'defunkt/dotjs'
        ];

        var data = {
            pullRequests: [],
            comments: []
        };

        var promises = repos.map(function(repo) {
            return new Promise(function(onFulfilled, onRejected) {
                that.api.getPullRequests(repo, function(err, json) {
                    if (err) {
                        onRejected(err);
                        return;
                    }
                    onFulfilled(json);
                });
            });
        });
        Promise.all(promises).then(function(results) {
            // create PullRequest's List
            var pullRequests = [];
            results.forEach(function(list) {
                list.forEach(function(pullRequest) {
                    pullRequests.push(pullRequest);

                    data.pullRequests.push({
                        id: pullRequest.id,             // PR Identifier
                        user: pullRequest.user.login,            // 起票者
                        repo: pullRequest.base.repo.full_name,   // リポジトリ
                        created_at: pullRequest.created_at        // 起票日
                    });
                });
            });

            var promises = pullRequests.map(function(pullRequest) {
                return new Promise(function(onFulfilled, onRejected) {
                    that.api.getComments(pullRequest.comments_url, function(err, comments) {
                        if (err) {
                            onRejected(err);
                            return;
                        }
                        comments.forEach(function(comment) {
                            comment.repo_name = pullRequest.base.repo.full_name;
                        });
                        onFulfilled(comments);
                    });
                });
            });
            return Promise.all(promises);
        }).then(function(results) {
            results.forEach(function(comments) {
                comments.forEach(function(comment) {
                    data.comments.push({
                        id: comment.id,             // Comment Identifier
                        user: comment.user.login,   // コメンター
                        body: comment.body,         // コメント本文
                        repo: comment.repo_name,
                        created_at: comment.created_at
                    });
                });
            });
            that.data = data;
            done();
        });
    });

    /**
     * makeDataInOrderOfDate 日付毎にデータを整頓して返す
     * @param data PRとCommentに分類されたデータ
     * {
     *     pullRequest: [{}, ...],
     *     comments: [{}, ...]
     * }
     * @return dataTable 日付毎に分類されたデータ
     * {
     *     '2014-01': {
     *         pullRequests: [{}, ...],
     *         comments: [{}, ...]
     *     }, ...
     * }
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

    it('analyze data.json', function() {
        expect(fs).to.be.ok;

        var data = this.data;
        expect(data).to.be.ok;

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
            return award;
        });

        //console.log(awards[0]);
    });
});return;
