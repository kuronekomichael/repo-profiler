function makeGraph(query, dataSet, color) {

    var maxLength = d3.max(dataSet, function(d) { return d.key.length; });
    console.log(maxLength);

    var svgW = $(query).width();
    var svgH = dataSet.length * 30;
    var nameLabelMargin = 170;
    var barVerticalPadding = 6;
    var barHeight = 20;

    var svg = d3.select(query)
    	.append('svg')
    	.attr({ width: svgW, height: svgH });

    var scale = d3.scale.linear()
    	.domain([0, d3.max(dataSet, function(d){ return d.count })])
    	.range([0, svgW - nameLabelMargin]);

    svg.selectAll('rect')
    	.data(dataSet)
    	.enter()
    	.append('rect')
    	.attr({
    		x: nameLabelMargin,
    		y: function(d, i){ return (i * barHeight) + (barVerticalPadding * i) },
    		width: function(d){ return scale(d.count) },
    		height: barHeight,
    		fill: color
    	});

    // 名前ラベル
    svg.selectAll('text')
        .data(dataSet)
        .enter()
        .append('text')
        .text(function(data) { return data.key; })
        .attr("text-anchor", "end")
        .attr("x", function(d, i) {
            return 160;
        })
        .attr("y", function(d, i) {
            return (i * (barHeight + barVerticalPadding)) + (barHeight / 2) + 5;
        });

    // 値ラベル
    svg.selectAll('text-count')
        .data(dataSet)
        .enter()
        .append('text')
        .text(function(data) { return data.count; })
        .attr("x", function(d, i) {
            console.log("scale:", d.count, scale(d.count));
            return scale(d.count) + nameLabelMargin - 15;
        })
        .attr("y", function(d, i) {
            return (i * (barHeight + barVerticalPadding)) + (barHeight / 2) + 5;
        })
        .attr("fill", "white");

    return;
}

function showTabBody(event) {
    var label = $(this).data('label');

    if ($('#tab-body-' + label).data('loading')) return;

    $.getJSON('data/' + label + '.json', function(awards) {
        makeGraph('#tab-body-' + label + ' .js-mpp', awards.mpp, '#3ECFEC');
        makeGraph('#tab-body-' + label + ' .js-mpr', awards.mpr, '#5AEFDB');
        makeGraph('#tab-body-' + label + ' .js-mcp', awards.mcp, '#F6B64C');
        makeGraph('#tab-body-' + label + ' .js-mcr', awards.mcr, '#dfc47e');
        $('#tab-body-' + label).data('loading', true)
    });
}

$(function() {
    $.getJSON('data/labels.json', function(labels) {
        // 直近半年分のみに限定
        labels.splice(0, labels.length - 6);

        // タブ生成
        var templateNavi = Handlebars.compile($('#tab-template').html());
        var templateTabBody = Handlebars.compile($('#tab-body-template').html());
        labels.forEach(function(label) {
            $('#date-nav').append(templateNavi({label: label}));
            $('#tab-body').append(templateTabBody({label: label}));
        });
        $('.js-tab').on('click', showTabBody);

        // 末尾のタブを選択
        $('#tab-' + labels.pop()).click();
    });
});
