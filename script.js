function renderBuildTimes(selector, data, baseUrl) {
	var valueLabelWidth = 40; // space reserved for value labels (right)
	var barHeight = 20; // height of one bar
	var barLabelWidth = 50; // space reserved for bar labels
	var barLabelPadding = 5; // padding between bar and bar labels (left)
	var gridLabelHeight = 18; // space reserved for gridline labels
	var gridChartOffset = 3; // space between start of grid and first bar
	var maxBarWidth = 420; // width of the bar with the max value

	// accessor functions 
	var barValue = function(d) { return d.duration/60; };

	// scales
	var yScale = d3.scale.ordinal().domain(d3.range(0, data.length)).rangeBands([0, data.length * barHeight]);
	var y = function(d, i) { return yScale(i); };
	var yText = function(d, i) { return y(d, i) + yScale.rangeBand() / 2; };
	var x = d3.scale.linear().domain([0, d3.max(data, barValue)]).range([0, maxBarWidth]);
	// svg container element
	var chart = d3.select().html('').append("svg")
	var chart = d3.select(selector).html('').append("svg")
	.attr('width', maxBarWidth + barLabelWidth + valueLabelWidth)
	.attr('height', gridLabelHeight + gridChartOffset + data.length * barHeight);
	// grid line labels
	var gridContainer = chart.append('g')
	.attr('transform', 'translate(' + barLabelWidth + ',' + gridLabelHeight + ')'); 
	gridContainer.selectAll("text").data(x.ticks(10)).enter().append("text")
	.attr("x", x)
	.attr("dy", -3)
	.attr("text-anchor", "middle")
	.text(String);
	// vertical grid lines
	gridContainer.selectAll("line").data(x.ticks(10)).enter().append("line")
	.attr("x1", x)
	.attr("x2", x)
	.attr("y1", 0)
	.attr("y2", yScale.rangeExtent()[1] + gridChartOffset)
	.style("stroke", "#ccc");
	// bar labels
	var labelsContainer = chart.append('g')
	.attr('transform', 'translate(' + (barLabelWidth - barLabelPadding) + ',' + (gridLabelHeight + gridChartOffset) + ')'); 
	labelsContainer.selectAll('text').data(data).enter().append('text')
	.attr('class', 'build-nr')
	.attr('y', yText)
	.attr("dy", ".35em") // vertical-align: middle
	.attr('text-anchor', 'end')
	.text(function(d) { return d.number; })
	.on('click', function(d) {
		window.open(baseUrl + d.id);
	});

	// bars
	var barsContainer = chart.append('g')
	.attr('transform', 'translate(' + barLabelWidth + ',' + (gridLabelHeight + gridChartOffset) + ')'); 
	barsContainer.selectAll("rect").data(data).enter().append("rect")
	.attr('y', y)
	.attr('height', yScale.rangeBand())
	.attr('width', function(d) { return x(barValue(d)); })
	.attr('stroke', 'white')
	.attr('fill', function(d) {
		return d.result === 0 ? '#038035' : '#CC0000';
	});
	// bar value labels
	barsContainer.selectAll("text").data(data).enter().append("text")
	.attr("x", function(d) { return x(barValue(d)); })
	.attr("y", yText)
	.attr("dx", 3) // padding-left
	.attr("dy", ".35em") // vertical-align: middle
	.attr("text-anchor", "start") // text-align: right
	.attr("fill", "black")
	.attr("stroke", "none")
	.text(function(d) { return d3.round(barValue(d), 2); });
	// start line
	barsContainer.append("line")
	.attr("y1", -gridChartOffset)
	.attr("y2", yScale.rangeExtent()[1] + gridChartOffset)
	.style("stroke", "#000");
}

function updateChart() {
	var repoName = document.getElementById('repo-name').value;
	var baseUrl = 'https://travis-ci.org/' + repoName + '/builds/';

	var buildsUrl = 'https://api.travis-ci.org/repos/' + repoName + '/builds?event_type=push';

	var builds = [];

	var oldestBuild = Infinity;
	var i=0, n=15;

	function filterBuilds(rawBuilds) {
		var curOldestBuild = oldestBuild;

		rawBuilds.forEach(function(build) {
			var buildNr = Number(build.number);
			if (buildNr < curOldestBuild) {
				curOldestBuild = buildNr;
			}

			if (build.branch !== 'master' || build.state !== 'finished') {
				return;
			}

			build.started_at = Date.parse(build.started_at);

			builds.push(build);
		});

		renderBuildTimes('#build-times', builds, baseUrl);

		if (++i < n && curOldestBuild < oldestBuild) {
			oldestBuild = curOldestBuild;
			d3.json(buildsUrl + '&after_number=' + oldestBuild, filterBuilds);
		}
	}

	d3.json(buildsUrl, filterBuilds);
}

updateChart();

d3.select('form').on('submit', function() {
	d3.event.preventDefault();

	updateChart();
});
