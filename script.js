var defaultConfig = {
	travis_endpoint: 'travis-ci.org',
	travis_api_endpoint: 'api.travis-ci.org',
	travis_api_token: false,
}
var config;

d3.round = function(x, n) { var ten_n = Math.pow(10,n); return Math.round(x * ten_n) / ten_n; }

function renderBuildCounts(container, data) {
	var valueLabelWidth = 40; // space reserved for value labels (right)
	var barHeight = 20; // height of one bar
	var barLabelWidth = 130; // space reserved for bar labels
	var barLabelPadding = 5; // padding between bar and bar labels (left)
	var gridLabelHeight = 18; // space reserved for gridline labels
	var gridChartOffset = 3; // space between start of grid and first bar
	var maxBarWidth = 420; // width of the bar with the max value

	// accessor functions
	var barValue = function(d) { return d.value; };

	var maxValue = d3.max(data, barValue);

	// scales
	var yScale = d3.scaleBand().domain(d3.range(0, data.length)).range([0, data.length * barHeight]);
	var y = function(d, i) { return yScale(i); };
	var yText = function(d, i) { return y(d, i) + yScale(1) / 2; };
	var x = d3.scaleLinear().domain([0, maxValue]).range([0, maxBarWidth]);

	var maxY = yScale.domain().pop();

	// svg container element
	var chart = d3.select(container).html('').append("svg")
		.attr('width', maxBarWidth + barLabelWidth + valueLabelWidth)
		.attr('height', gridLabelHeight + gridChartOffset + data.length * barHeight);

	// grid line labels
	var ticks = x.ticks(maxValue >= 10 ? 10 : maxValue);

	var gridContainer = chart.append('g')
		.attr('transform', 'translate(' + barLabelWidth + ',' + gridLabelHeight + ')');
	gridContainer.selectAll("text").data(ticks).enter().append("text")
		.attr("x", x)
		.attr("dy", -3)
		.attr("text-anchor", "middle")
		.text(String);

	// vertical grid lines
	gridContainer.selectAll("line").data(ticks).enter().append("line")
		.attr("x1", x)
		.attr("x2", x)
		.attr("y1", 0)
		.attr("y2", yScale(maxY) + gridChartOffset)
		.style("stroke", "#ccc");

	// bar labels
	var labelsContainer = chart.append('g')
		.attr('transform', 'translate(' + (barLabelWidth - barLabelPadding) + ',' + (gridLabelHeight + gridChartOffset) + ')');

	labelsContainer.selectAll('text').data(data).enter().append('text')
		.attr('y', yText)
		.attr("dy", ".35em") // vertical-align: middle
		.attr('text-anchor', 'end')
		.text(function(d) { return d.key; });

	// bars
	var barsContainer = chart.append('g')
		.attr('transform', 'translate(' + barLabelWidth + ',' + (gridLabelHeight + gridChartOffset) + ')');

	barsContainer.selectAll("rect").data(data).enter().append("rect")
		.attr('y', y)
		.attr('height', yScale(1))
		.attr('width', function(d) { return x(barValue(d)); })
		.attr('stroke', 'white')
		.attr('fill', 'steelblue');

	// start line
	barsContainer.append("line")
		.attr("y1", -gridChartOffset)
		.attr("y2", yScale(maxY) + gridChartOffset)
		.style("stroke", "#000");
}

function renderBuildTimes(container, barValue, data, baseUrl) {
	var paddingLeft = 5; // space to the left of the bars
	var paddingRight = 10; // space to the right of the bars
	var barHeight = 5; // height of one bar
	var barPaddingV = 1; // vertical padding between bars
	var gridLabelHeight = 18; // space reserved for gridline labels
	var gridChartOffset = 3; // space between start of grid and first bar
	var maxBarWidth = 450; // width of the bar with the max value

	// scales
	var yScale = d3.scaleBand()
		.domain(d3.range(0, data.length + 1))
		.range([0, (data.length + 1) * (barHeight+barPaddingV)]);
	var y = function(d, i) { return yScale(i) + barPaddingV*i; };
	var yText = function(d, i) { return y(d, i) + yScale.rangeBand() / 2; };

	var maxValue = d3.max(data, barValue);

	var x = d3.scaleLinear()
		.domain([0, maxValue])
		.range([0, maxBarWidth]);

	var maxY = yScale.domain().pop();

	// svg container element
	var chart = d3.select(container).html('').append("svg")
		.attr('width', maxBarWidth + paddingLeft + paddingRight)
		.attr('height', gridLabelHeight + gridChartOffset + data.length * (barHeight+barPaddingV*2));

	// grid line labels
	var ticks = x.ticks(10);

	var f = d3.format('.1f');

	function asSeconds(val) {
		return f(val) + 's';
	}

	function asMinutes(val) {
		return f(val / 60) + 'm';
	}

	function asHours(val) {
		return f(val / 3600) + 'h';
	}

	if (maxValue < 2 * 60) {
		format = asSeconds;
	} else if (maxValue <= 3600) {
		format = asMinutes;
	} else {
		format = asHours;
	}

	var gridContainer = chart.append('g')
		.attr('transform', 'translate(' + paddingLeft + ',' + gridLabelHeight + ')');
	gridContainer.selectAll("text").data(ticks).enter().append("text")
		.attr("x", x)
		.attr("dy", -3)
		.attr("text-anchor", "middle")
		.text(format);

	// vertical grid lines
	gridContainer.selectAll("line").data(ticks).enter().append("line")
		.attr("x1", x)
		.attr("x2", x)
		.attr("y1", 0)
		.attr("y2", yScale(maxY) + gridChartOffset + barPaddingV*data.length)
		.style("stroke", "#ccc");

	// bars
	var barsContainer = chart.append('g')
		.attr('transform', 'translate(' + paddingLeft + ',' + (gridLabelHeight + gridChartOffset) + ')');
	barsContainer.selectAll("rect").data(data).enter().append("rect")
		.attr('y', y)
		.attr('height', yScale(1))
		.attr('width', function(d) { return x(barValue(d)); })
		.attr('stroke', 'white')
		.attr('class', 'build-time-bar')
		.attr('fill', function(d) {
			return d.result === 0 ? '#038035' : '#CC0000';
		})
		.on('click', function(d) {
			window.open(baseUrl + d.id);
		});
}

function getBuildDate(build) {
	var dt = new Date(Date.parse(build.started_at));
	return dt.toDateString();
}

function updateBuildCounts(buildCounts, build) {
	var buildDate = getBuildDate(build);

	if (!buildCounts[buildDate]) {
		buildCounts[buildDate] = 1;
	} else {
		buildCounts[buildDate] += 1;
	}
}

// Build clock time, in seconds.
function getClockTime(build) {
	var started_at = Date.parse(build.started_at);
	var finished_at = Date.parse(build.finished_at);

	return (finished_at - started_at) / 1000;
}

// Build duration, in seconds.
function getDuration(build) {
	return build.duration;
}

function retrieveJson(url, callback) {
	var req = d3.json(url);
	if (config.travis_api_token) {
		req = req.header("Authorization", 'token ' + config.travis_api_token);
	}
	req.get(callback);
}

/**
 * Iterate over builds retrieved from Travis CI.
 *
 * @param {String} repoName - The repository name.
 * @param {Number} maxRequests - How many API requests to make. 
 * @param {Function} cb - Called once for each API response.
 */
function iterBuilds(repoName, maxRequests, cb) {
	var buildsUrl = 'https://' + config.travis_api_endpoint + '/repos/' + repoName + '/builds?event_type=push';

	var i=0;

	var oldestBuild = Infinity;

	function handleResponse(rawBuilds) {
		if (typeof rawBuilds.length === 'undefined') {
			alert('invalid repository: ' + repoName);
			return;
		}

		var curOldestBuild = Math.min.apply(null, rawBuilds.map(function(build) {
			return parseInt(build.number, 10);
		}));

		cb(rawBuilds);

		if (++i < maxRequests && curOldestBuild < oldestBuild) {
			oldestBuild = curOldestBuild;
			retrieveJson(buildsUrl + '&after_number=' + oldestBuild, handleResponse);
		}
	}

	retrieveJson(buildsUrl, handleResponse);
}

function updateChart() {
	var repoName = document.getElementById('repository').value;
	// need at least "a/a"
	if (repoName.length < 3) {
		return;
	}

	var branch = document.getElementById('branch').value;
	if (!branch.length) {
		alert('Need to give a branch name.');
	}

	var reqCount = document.getElementById('requests').value;

	var baseUrl = 'https://' + config.travis_endpoint + '/' + repoName + '/builds/';

	var builds = [];

	var buildCounts = {};

	function isValidBuild(build) {
		return build.branch === branch && build.state === 'finished';
	}

	function filterBuilds(rawBuilds) {
		var filteredBuilds = rawBuilds.filter(isValidBuild);

		if (!filteredBuilds.length) return;

		filteredBuilds.forEach(function(build) {
			builds.push(build);
			updateBuildCounts(buildCounts, build);
		});

		renderBuildTimes('#build-times-duration', getDuration, builds, baseUrl);
		renderBuildTimes('#build-times', getClockTime, builds, baseUrl);
		renderBuildCounts('#build-counts', d3.entries(buildCounts), baseUrl);
	}

	iterBuilds(repoName, reqCount, filterBuilds);
}

function updateInputViaHash() {
	var parts = window.location.hash.substr(1).split('/');

	if (parts.length === 1) {
		return;
	}

	document.getElementById('repository').value = parts[0] + '/' + parts[1]; 

	if (parts[2]) {
		document.getElementById('branch').value = parts.slice(2).join('/');
	}
}

function updateHashViaInput() {
	var repository = document.getElementById('repository').value;
	if (!repository) {
		return;
	}

	var value = repository;

	var branch = document.getElementById('branch').value;
	if (branch) {
		value += '/' + branch;
	}

	window.location.hash = '#' + value;
}

d3.select(window).on('hashchange', updateInputViaHash);

d3.select('form').on('submit', function() {
	d3.event.preventDefault();

	updateHashViaInput();
	updateChart();
});

function getConfigUrl() {
	return location.pathname.replace('index.html', '') + 'config.json';
}

updateInputViaHash();

d3.json(getConfigUrl())
	.on('error', function(error) {
		config = defaultConfig;
	})
	.on('load', function(response) {
		config = response;
		updateChart();
	})
	.get();
