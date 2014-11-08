function makeGraph(query, dataSet, color) {

    var svgW = $(query).width();
    var svgH = 500;
    var nameLabelMargin = 110;
    var barVerticalPadding = 10;
    var barHeight = (svgH / dataSet.length) - barVerticalPadding;

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

    svg.selectAll('text')
        .data(dataSet)
        .enter()
        .append('text')
        .text(function(data) { return data.key; })
        .attr("x", function(d, i) {
            return 10;
        })
        .attr("y", function(d, i) {
            return (i * (barHeight + barVerticalPadding)) + (barHeight / 2);
        });

    svg.selectAll('text-count')
        .data(dataSet)
        .enter()
        .append('text')
        .text(function(data) { return data.count; })
        .attr("x", function(d, i) {
            return scale(d.count) + (nameLabelMargin / 2);
        })
        .attr("y", function(d, i) {
            return (i * (barHeight + barVerticalPadding)) + (barHeight / 2);
        })
        .attr("fill", "white");

    return;
}

function showTabBody(event) {
    var label = $(this).data('label');

    $.getJSON('data/' + label + '.json', function(awards) {
        makeGraph('.active .js-mpp', awards.mpp, '#3ECFEC');
        makeGraph('.active .js-mpr', awards.mpr, '#5AEFDB');
        makeGraph('.active .js-mcp', awards.mcp, '#F6B64C');
        makeGraph('.active .js-mcr', awards.mcr, '#E9D7A7');
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
