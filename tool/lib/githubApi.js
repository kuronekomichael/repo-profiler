var request = require('request');

function GitHubAPI() {
    this.host = 'https://api.github.com';
    this.headers = {
        'User-Agent': 'node-github-api'
    };
}

GitHubAPI.prototype.setHost = function(newHost) {
    this.host = newHost;
}

GitHubAPI.prototype.setAuth = function(user, token) {
    this.auth = {
        'user': user,
        'pass': token
    };
}

GitHubAPI.prototype.getPullRequests = function(repoName, cb) {
    //this.getPullRequestsWithStatus(repoName, 'all', cb);
    var pulls = [];
    this.getPullRequestsWithStatus(repoName, 'open', function(err, openPulls) {
        if (err) {
            cb(err)
            return;
        }
        Array.prototype.push.apply(pulls, openPulls);
        this.getPullRequestsWithStatus(repoName, 'closed', function(err, closedPulls) {
            if (err) {
                cb(err)
                return;
            }
            Array.prototype.push.apply(pulls, closedPulls);
            cb(err, pulls);
        });
    });
};


GitHubAPI.prototype.getPullRequestsWithStatus = function(repoName, status, cb) {
    var that = this;

    var pulls = [];
    function getPulls(page) {
        request.get({
            url: that.host + '/repos/' + repoName + '/pulls',
            qs: {
                page: page,
                per_page: 100,
                state: status
            },
            auth: that.auth,
            headers: that.headers
        }, function(err, res, doc) {
            if (err) {
                cb(err);
                return;
            }
            Array.prototype.push.apply(pulls, JSON.parse(doc.toString()));

            var link = res.headers.link;
            if (!link) {
                cb(null, pulls);
                return;
            }
            var matched = link.split(',')[1].match(/\?page=(\d+)&/);
            if (!matched) {
                cb(new Error(matched));
                return;
            }
            var lastPageNum = parseInt(matched[1], 10);
            if (page < lastPageNum) {
                setTimeout(function() {
                    getPulls(page + 1);
                }, 0);
            } else {
                cb(null, pulls);
            }
        });
    }

    getPulls(1);
};

GitHubAPI.prototype.getComments = function(commentUrl, cb) {
    var that = this;

    var comments = [];
    function getComments(page) {
        request.get({
            url: commentUrl,
            qs: {
                page: page,
                per_page: 100
            },
            auth: that.auth,
            headers: that.headers
        }, function(err, res, doc) {
            if (err) {
                cb(err);
                return;
            }
            Array.prototype.push.apply(comments, JSON.parse(doc.toString()));

            var link = res.headers.link;
            if (!link) {
                cb(null, comments);
                return;
            }
            var matched = link.split(',')[1].match(/\?page=(\d+)&/);
            if (!matched) {
                cb(new Error(matched));
                return;
            }
            var lastPageNum = parseInt(matched[1], 10);
            if (page < lastPageNum) {
                setTimeout(function() {
                    getComments(page + 1);
                }, 0);
            } else {
                cb(null, comments);
            }
        });
    }

    getComments(1);
};

module.exports = GitHubAPI;
