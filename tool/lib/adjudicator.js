function sorter(targetList, getRankingKey) {
    var book = {};
    var resultList = [];
    targetList.forEach(function(data) {
        var key = getRankingKey(data);
        if (!book[key]) {
            book[key] = 0;
        }
        book[key]++;
    });
    for (var key in book) {
        resultList.push({
            key: key,
            count: book[key]
        });
    }
    resultList.sort(function(a, b) {
        // 第1ソート条件: カウント数
        if (a.count > b.count) return -1;
        if (a.count < b.count) return 1;
        // 第2ソート条件: キーのアルファベット順
        if (a.key > b.key) return 1;
        if (a.key < b.key) return -1;
        return 0;
    });
    return resultList;
}

module.exports = {
    // 最もPullRequestを発行した人で賞
    judgeMostPullRequestPersonAward: function(pullRequests) {
        //console.log(pullRequests);
        return sorter(pullRequests, function(pr) { return pr.user; });
    },
    // 最もPullRequestを多く発行しているリポジトリで賞
    judgeMostPullRequestRepositoryAward: function(pullRequests) {
        return sorter(pullRequests, function(pr) { return pr.repo; });
    },
    // 一番コメントをしている人で賞
    judgeMostCommentPersonAward: function(comments) {
        return sorter(comments, function(comment) { return comment.user; });
    },
    // 一番コメントをもらったリポジトリで賞
    judgeMostCommentRepositoryAward: function(comments) {
        return sorter(comments, function(comment) { return comment.repo; });
    }
};
