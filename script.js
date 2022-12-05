	let jsonData = null;
	let topTenForChart = new Array();

	function loadData() {
	    if (!$("#sURL").val()) {
	        alert("Please provide valid URL to load data from...");
	        $("#sURL").focus();
	        return;
	    }
	    $("#btnLoad").prop('disabled', true);
	    $.getJSON($("#sURL").val(), function(data) {
	        $("#lineContainer").empty();
	        $("#mainContainer div").remove();
	        currentPosition = { left: 0, top: 0 };
	        console.log(data.nodes);
	        console.log(data.links);
	        jsonData = data;
	        printGraph();

	        $(".draggable").draggable({
	            preventCollision: true,
	            containment: "#mainContainer",
	            start: function(event, ui) {
	                //$(this).removeClass('butNotHere');
	            },
	            drag: function() {
	                updateConnectors($(this).attr("id"));
	            },
	            stop: function(event, ui) {
	                //$(this).addClass('butNotHere');
	                updateConnectors($(this).attr("id"));
	            }
	        });

	        drawConnectors();

	        $("#btnLoad").prop('disabled', false);
	    }).fail(function(excp) {
	        console.log("An error has occurred.");
	        console.log(excp);
	        alert("An error has occurred.");
	        $("#btnLoad").prop('disabled', false);
	    });
	}

	$(document).ready(function() {
	    $("#lineContainer").css({ top: $("#mainContainer").css('top'), left: $("#mainContainer").css('left') });
	    $(document).tooltip({
	        track: true,
	        content: function() {
	            return $(this).prop('title');
	        }
	    });
	    $("#intervalFrequency").prop('selectedIndex', 0);
	    $(function() {
	        $("#tabs").tabs();
	    });
	}); //document ready

	//this will hold the quadrant of current node, so next can be plotted easily
	let currentPosition = { left: 0, top: 0 };

	//move the position to next quadrant
	function nextPosition() {
	    currentPosition.left++;
	    currentPosition.top++;

	    if (currentPosition.left > 5) {
	        currentPosition.left = 1;
	    }
	}

	function printGraph() {
	    let inputs = [];
	    let outputs = [];

	    $.each(jsonData.links, function(index, value) {
	        inputs.push(value.to);
	        outputs.push(value.from);
	    });

	    $.each(jsonData.nodes, function(index, value) {
	        if (value && value.sendTimers) {
	            topTenForChart.push(value);
	        }

	        if (inputs.includes(value.nodeId) == false) {
	            if (value.componentType === "null-channel") {
	                return;
	            }
	            currentPosition.left = 0;
	            currentPosition.top++;
	            $("#mainContainer").append(getNodeUI(value));

	            drawChain(value.nodeId);
	        }
	    });

	    $.each(jsonData.nodes, function(index, value) {
	        if (value.componentType === "null-channel") {
	            return;
	        }
	        if ($("#node_" + value.nodeId).length > 0) {
	            return;
	        }

	        currentPosition.left = 0;
	        currentPosition.top++;
	        $("#mainContainer").append(getNodeUI(value));
	        drawChain(value.nodeId);
	    });

	    $("#mainContainer").height(currentPosition.top * 45);

	    $("#lineContainer").height($("#mainContainer").height());
	    $("#lineContainer").css({ top: $("#mainContainer").css('top'), left: $("#mainContainer").css('left') });

	    $(".output").hide();
	    $(".input").hide();
	    //console.log(topTenForChart);
	    findTopTenNodes();
	}

	function getNodeByID(a_nodeID) {
	    let returnNode = null;
	    $.each(jsonData.nodes, function(index, value) {
	        if (value.nodeId == a_nodeID) {
	            returnNode = value;
	        }
	    });
	    return returnNode;
	}

	function drawChain(a_outputNodeId) {
	    $.each(jsonData.links, function(index, value) {
	        //console.log(value.from + " - " + a_outputNodeId);
	        if (value.from == a_outputNodeId) {
	            if ($("#node_" + value.to).length < 1) {
	                $("#mainContainer").append(getNodeUI(getNodeByID(value.to)));
	                drawChain(value.to);
	            }
	        }
	    });
	}

	function getNodeUI(a_object) {
	    let nodeType = a_object.componentType;
	    if (a_object.componentType === "ws:inbound-gateway" || a_object.componentType === "service-activator" ||
	        a_object.componentType === "nullChannel") {
	        nodeType = "gateway";

	    }

	    let leftPos = (currentPosition.left * 250) + 50;
	    let topPos = (currentPosition.top * 40) + 50;

	    nextPosition();
	    let tooltipText = '<b style="color:red">' + (a_object.nodeId + '# (' + a_object.componentType + ')</b></br>' + a_object.name) + '<br/><pre class="josnData">' + JSON.stringify(a_object, undefined, 2) + '</pre>';
	    let returnString = "<div class='" + nodeType + " draggable' title='" + tooltipText + "' id='node_" + a_object.nodeId +
	        "' style='left:" + leftPos + "; top: " + topPos + "'><div class='contentblock'><div class='leftblock'>";

	    if (a_object.componentType === "router") {
	        returnString += "<img src='router.png' class='contnet-img' width='30px'/>";
	    } else if (a_object.componentType === "service-activator") {
	        returnString += "<img src='router.png' class='contnet-img' width='30px'/>";
	    } else if (a_object.componentType === "gateway" || a_object.componentType === "ws:inbound-gateway") {
	        returnString += "<img src='router.png' class='contnet-img' width='30px'/>";
	    } else if (a_object.componentType === "chain") {
	        returnString += "<img src='router.png' class='contnet-img' width='30px'/>";
	    } else if (a_object.componentType === "channel") {
	        returnString += "<img src='router.png' class='contnet-img' width='30px'/>";
	    }
	    returnString += "<span class='greencls'>";
	    if(typeof a_object.sendTimers != "undefined") {
	    	returnString += a_object.sendTimers.successes.count;
	    }else{
	    	returnString += "N/A";
	    }
	    returnString += "</span>";
	    returnString += "<span class='redcls'>";
	    if(typeof a_object.sendTimers != "undefined") {
	    	returnString += a_object.sendTimers.failures.count;
	    }else{
	    	returnString += "N/A";
	    }
	    returnString += "</span></div>";
	    returnString += "<span class='desc'>" + a_object.name + "</span></div>";
	    returnString += "<span class='output'>&#9654;</span>";
	    returnString += "<span class='input'>&#9654;</span>";

	    returnString += "</div>";
	    return returnString;
	}

	function drawConnectors() {
	    let connectorColour = "blue";

	    $.each(jsonData.links, function(index, value) {
	        value.ID = index;
	        //console.log(value.from + "->" + value.to);
	        if ($("#node_" + value.from).length > 0 && $("#node_" + value.to).length > 0) {

	            if ($("#node_" + value.from).hasClass("channel") && $("#node_" + value.to).hasClass("router")) {
	                connectorColour = "green";
	            } else if ($("#node_" + value.from).hasClass("channel") && $("#node_" + value.to).hasClass("chain")) {
	                connectorColour = "purple";
	            } else {
	                connectorColour = "blue";
	            }

	            let newLine = $(document.createElementNS('http://www.w3.org/2000/svg', 'path')).attr({
	                id: 'path_' + index,
	                'stroke-width': '3px',
	                stroke: connectorColour,
	                fill: "none",
	                'stroke-linecap': "round"
	            });


	            $("#lineContainer").append(newLine);
	            if (value.type === 'route') {
	                $(newLine).attr('stroke-dasharray', "10,10,10");
	            } else if (value.type === 'input') {
	                $(newLine).attr('stroke-dasharray', "5,5,5");
	            }

	            if (value.type === 'error') {
	                $(newLine).attr('stroke', "red");
	            }
	            updateLinePath(value);
	        }
	    });

	    $("#lineContainer path")
	        .mouseenter(function() {
	            //console.log($(this ).attr("id"));
	            let currentLink = getLinkByID($(this).attr("id"));
	            $("#node_" + currentLink.from).toggleClass("highlight");
	            $("#node_" + currentLink.to).toggleClass("highlight");
	            //highlight
	        })
	        .mouseleave(function() {
	            //console.log($(this ).attr("id"));
	            let currentLink = getLinkByID($(this).attr("id"));
	            $("#node_" + currentLink.from).toggleClass("highlight");
	            $("#node_" + currentLink.to).toggleClass("highlight");
	        });
	}

	function getLinkByID(a_linkID) {
	    let srcID = parseInt(a_linkID.substring(5));
	    let returnLink = null;
	    $.each(jsonData.links, function(index, value) {
	        if (value.ID == srcID) {
	            returnLink = value;
	        }
	    });
	    return returnLink;
	}


	function updateConnectors(a_sourceId) {
	    let src = parseInt(a_sourceId.substring(5));

	    let filteredLines = jsonData.links.filter(function(obj) {
	        if (obj.from == src) {
	            //console.log(obj.from);
	            return obj;
	        }

	    });

	    $.each(filteredLines, function(index, value) {
	        if ($("#path_" + value.ID).length > 0) {
	            updateLinePath(value);
	        }
	        //console.log($("#path_" + value.ID	))
	    });

	    filteredLines = jsonData.links.filter(function(obj) {
	        if (obj.to == src) {
	            //console.log(obj.from);
	            return obj;
	        }

	    });

	    $.each(filteredLines, function(index, value) {
	        if ($("#path_" + value.ID).length > 0) {
	            updateLinePath(value);
	        }
	        //console.log($("#path_" + value.ID	))
	    });
	    //console.log(src);
	}

	function updateLinePath(a_link) {
	    let startPos = $("#node_" + a_link.from).position();
	    startPos.left += 136;
	    startPos.top = startPos.top - 36;

	    let endPos = $("#node_" + a_link.to).position();
	    endPos.left -= 30;
	    endPos.top = endPos.top - 36;;

	    let midX = startPos.left + 20;
	    let midY = startPos.top;

	    let midX1 = midX;
	    let midY1 = endPos.top;

	    //let direction = "M" + Math.ceil(startPos.left) + "," + Math.ceil(startPos.top) + " Q" + Math.ceil(midX) + "," + Math.ceil(midY) + " " + Math.ceil(endPos.left) + "," + Math.ceil(endPos.top) + " ";
	    //let direction = "M" + Math.ceil(startPos.left) + "," + Math.ceil(startPos.top) + " Q" + midX + "," + midY + " " + midX1 + "," + midY1 + " T" + endPos.left + "," + Math.ceil(endPos.top);

	    let direction = "M" + (startPos.left) + "," + (startPos.top) + " L" + midX + "," + midY + " L" + midX1 + "," + midY1 + " L" + endPos.left + "," + (endPos.top);

	    if (startPos.left > endPos.left) {

	        midY1 = endPos.top + 15;

	        let midX2 = endPos.left - 15;
	        let midY2 = endPos.top + 15;

	        let midX3 = midX2;
	        let midY3 = endPos.top;

	        direction = "M" + (startPos.left) + "," + (startPos.top) + " L" + midX + "," + midY + " L" + midX1 + "," + midY1 + " L" + midX2 + "," + midY2 + " L" + midX3 + "," + midY3 + " L" + endPos.left + "," + (endPos.top);

	    }

	    $("#path_" + a_link.ID).attr("d", direction);

	    $("#node_" + a_link.from).find(".output").show();
	    $("#node_" + a_link.to).find(".input").show();
	    //console.log(direction)
	}

	function getRandomInt(min, max) {
	    min = Math.ceil(min);
	    max = Math.floor(max);
	    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
	}


	let intervalElement;

	function reloadInterval() {
	    let frequency = $('#intervalFrequency').find(":selected").val();
	    if (intervalElement) {
	        clearInterval(intervalElement);
	    }

	    if (frequency < 0) {
	        clearInterval(intervalElement);
	    } else {
	        intervalElement = setInterval(loadData, 1000 * frequency);
	    }
	}


	//////////////code for chart

	function findTopTenNodes() {
	    topTenForChart.sort(function(firstElement, secondElement) {
	        let fMean = firstElement.sendTimers.successes.mean;
	        if (fMean < firstElement.sendTimers.failures.mean) {
	            fMean = firstElement.sendTimers.failures.mean;
	        }
	        let sMean = secondElement.sendTimers.successes.mean;
	        if (sMean < secondElement.sendTimers.failures.mean) {
	            sMean = secondElement.sendTimers.failures.mean;
	        }
	        //console.log(fMean);
	        //console.log(sMean);
	        return sMean - fMean;
	    });
	    topTenForChart.splice(10);
	    //console.log(topTenForChart);
	    renderChart();
	}


	function renderChart() {

	    $("#chart").empty();

	    let chartData = [];
	    let mean = {};
	    mean.name = "Mean";
	    mean.type = 'column';
	    mean.data = [];

	    let max = {};
	    max.name = "Max";
	    max.type = 'column';
	    max.data = [];

	    let requestCount = {};
	    requestCount.name = "Request Count";
	    requestCount.type = 'line';
	    requestCount.data = [];

	    let categories = [];
	    $.each(topTenForChart, function(index, value) {
	        mean.data.push(Math.round((value.sendTimers.successes.mean + Number.EPSILON) * 100) / 100);
	        max.data.push(Math.round((value.sendTimers.successes.max + Number.EPSILON) * 100) / 100);
	        requestCount.data.push(value.sendTimers.successes.count);
	        categories.push(value.name);
	    });
	    chartData.push(mean);
	    chartData.push(max);
	    chartData.push(requestCount);

	    var options = {
	        chart: {
	            height: 550,
	            type: "line",
	            stacked: false
	        },
	        dataLabels: {
	            enabled: false
	        },
	        colors: ['#99C2A2', '#C5EDAC', '#66C7F4'],
	        series: chartData,
	        stroke: {
	            width: [4, 4, 4]
	        },
	        plotOptions: {
	            bar: {
	                columnWidth: "20%"
	            }
	        },
	        xaxis: {
	            categories: categories,
	            labels: {
	                rotate: -45
	            }
	        },
	        yaxis: [{
	                seriesName: 'Mean',
	                axisTicks: {
	                    show: true
	                },
	                axisBorder: {
	                    show: true,
	                },
	                title: {
	                    text: "Seconds"
	                }
	            },
	            {
	                seriesName: 'Mean',
	                show: false
	            }, {
	                opposite: true,
	                seriesName: 'Request Count',
	                axisTicks: {
	                    show: true
	                },
	                axisBorder: {
	                    show: true,
	                },
	                title: {
	                    text: "Count"
	                }
	            }
	        ]
	    };

	    var chart = new ApexCharts(document.querySelector("#chart"), options);

	    chart.render();


	}

	//////////////end code for chart