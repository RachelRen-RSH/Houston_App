
//esriConfig.apiKey = "AAPK809bcaa4b9554b8cb640df532b529a3eP5LHFphV7aXqVjRhL3vHcHdQJZALS-24db_cjJ_8X5_VnyAfyqpK-fd8zotUcHbn";

document.addEventListener('DOMContentLoaded', (event) => {
    const goToAppButton = document.getElementById('go_to_app');
    const modal = document.getElementById('example-modal');
    if (modal) {
        modal.open = true;
    }
    goToAppButton.addEventListener('click', () => {

        modal.open = false;
    });
});
require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/layers/GraphicsLayer",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Legend",
    "esri/widgets/AreaMeasurement2D",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/widgets/Print",
    "esri/widgets/Search",
    "esri/widgets/ScaleBar",
    "esri/widgets/TimeSlider",
    "esri/layers/support/FeatureFilter",
    "esri/smartMapping/labels/clusters",
    "esri/core/lang",
    "esri/core/promiseUtils",
    "esri/core/reactiveUtils",
    "esri/geometry/geometryEngine"
], function (Map, MapView, GeoJSONLayer, GraphicsLayer, BasemapGallery, Legend, AreaMeasurement2D, SketchViewModel, Print, Search, ScaleBar, TimeSlider, FeatureFilter, clusterLabelCreator, lang, promiseUtils, reactiveUtils, geometryEngine) {
    // Add layers to the map
    // Define the bin map of the crash layer
    // Esri color ramps - Esri Yellow and Green 1
    // #beac2dff,#e8d966ff,#fff58fff,#00bab5ff,#00807dff
    const colors = ["#beac2dff", "#e8d966ff", "#fff58fff", "#00bab5ff", "#00807dff"];

    const clusterConfig = {
        type: "cluster",
        clusterRadius: "100px",
        fields: [{
            name: "crash_total",
            alias: "Total crash",
            onStatisticField: "Crash_ID",
            statisticType: "count"
        }],
        // Talk to modeling person to see what else important information to add in the popup window.
        popupTemplate: {
            title: "Crash Cluster summary",
            content: "This cluster represents <b>{cluster_count}</b> crashes. <br><b>{expression/local-count}</b> of them happened on local roads.",
            fieldInfos: [{
                fieldName: "cluster_count",
                format: {
                    places: 0,
                    digitSeparator: true
                }
            }],
            expressionInfos: [
                {
                    name: "local-count",
                    title: "local-count",
                    expression: `
                  Count(Filter($aggregatedFeatures, "Onsys_Fl ='N'"))
                `
                },
            ]
        },
        // clusterMinSize: "24px",
        // clusterMaxSize: "60px",
        renderer: {
            type: "simple",
            symbol: {
                type: "simple-marker",
                style: "circle",
                color: "#007f99",
                size: 24,
                outline: {
                    color: "#ebe6df",
                    width: 1
                }
            },
            visualVariables: [{
                type: "size",
                field: "crash_total",
                stops: [
                    { value: 1, size: 6 },
                    { value: 2, size: 12 },
                    { value: 50, size: 20 },
                    { value: 200, size: 30 },
                    { value: 400, size: 40 },
                    { value: 800, size: 50 },
                    { value: 1200, size: 60 }
                ],
            }]
        },
        labelingInfo: [{
            deconflictionStrategy: "none",
            labelExpressionInfo: {
                expression: "Text($feature.cluster_count, '#,###')"
            },
            symbol: {
                type: "text",
                color: "white",
                font: {
                    weight: "bold",
                    family: "Noto Sans",
                    size: "12px"
                }
            },
            labelPlacement: "center-center",
        }]
    };

    var roadLayer = new GeoJSONLayer({
        url: "data/combined_road.geojson",
        title: "Roads",
        popupTemplate: {
            title: "{Full_Name} -- Rank {p_rank}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "ROAD_CL.x",
                            label: "Road Class"
                        },
                        {
                            fieldName: "OneWay",
                            label: "One Way",
                        },
                        {
                            fieldName: "orinttn",
                            label: "Orientation"
                        },
                        {
                            fieldName: "POSTEDSPEE",
                            label: "Speed Limit",
                        },
                        {
                            fieldName: "ADT",
                            label: "Average Daily Traffic",
                        },
                        {
                            fieldName: "SrfWdth",
                            label: "Road Surface Width",
                        },
                    ]
                }
            ]
        },
        renderer: {
            type: "simple", // autocasts as new SimpleRenderer()
            symbol: {
                type: "simple-line",
                color: "lightgray",
                width: 1.5
            },
            label: "Safety Index",
            visualVariables: [
                {
                    type: "color",
                    field: "p_rank",
                    //normalizationField: 
                    stops: [
                        {
                            value: "5",
                            color: "#a63603ff", // will be assigned this color (beige)
                            label: "5 - Highest Priority" // label to display in the legend
                        },
                        {
                            value: "4",
                            color: "#e6550dff", // will be assigned this color (purple)
                            label: "4 - High Priority"
                        },
                        {
                            value: "3",
                            color: "#fd8d3cff", // will be assigned this color (purple)
                            label: "3 - Fair"
                        },
                        {
                            value: "2",
                            color: "#fdbe85ff", // will be assigned this color (purple)
                            label: "2 - Low Priority"
                        },
                        {
                            value: "1",
                            color: "#feeddeff", // will be assigned this color (purple)
                            label: "1 - Lowest Priority" // label to display in the legend
                        }
                    ]
                }
            ]
        },
        outFields: ["*"]
    });

    var crashLayer = new GeoJSONLayer({
        url: "data/crash14_23_streetview.geojson",
        title: "Crashes (2014-2023)",
        featureReduction: clusterConfig,
        timeInfo: {
            startField: "Crash_Date",
            interval: {
                unit: "years",
                value: 1
            }
        },
        popupTemplate: {
            title: "Crash {Crash_ID}",
            content: "Happened on {Street_Nbr} {Street_Name} on {Crash_Date}, {Day_of_Week}. <br> <a href='{street_view_url}' target='_blank'>Google Street View</a>",
        },
        renderer: {
            type: "simple",
            field: "Crash_ID",
            symbol: {
                type: "simple-marker",
                size: 4,
                color: "#69dcff",
                outline: {
                    color: "rgba(0, 139, 174, 0.5)",
                    width: 5
                }
            }
        },
        visible: false,
        outFields: ["*"]
    });

    var ageLayer = new GeoJSONLayer({
        url: "data/city_demographics.geojson",
        popupTemplate: {
            title: "{NAME.x}",  // Assuming 'NAME' is the field for the area name
            content: [
                {
                    type: "text",
                    text: "Total Population (per Sq Mile): {expression/per-sq-mile}"  // Use an expression to calculate density
                }
            ],
            expressionInfos: [{
                name: "per-sq-mile",
                title: "Population per Square Mile",
                expression: "Round($feature.age_totE / $feature.area, 0)"  // Adjust field names as necessary and round the result
            }]
        },
        renderer: {
            type: "simple", // Use a simple renderer for single-symbol styling with visual variables
            symbol: {
                type: "simple-fill", // Use a simple-fill symbol for polygon data
                outline: { color: "black", width: 0 }
            },
            visualVariables: [{
                type: "color",
                field: "totpopE",
                normalizationField: "area",
                stops: [
                    { value: 0, color: "#cececeff" },
                    { value: 10000, color: "#404040ff" }  // Adjust these values according to your data's range
                ],
                legendOptions: {
                    title: "Total Population / sq mile"
                }
            }]
        },
        visible: false,
        outFields: ["*"]
    })

    const tree_with_layer = {
        "safety-index": roadLayer,
        "Crashes-Records": crashLayer, // Ensure this ID matches your HTML
        "age-population": ageLayer
    };

    var layerExpressions = {
        "safety-index": "",
        "Crashes-Records": "",
        "age-population": ""
    };

    var map = new Map({
        basemap: "gray",
        layers: [ageLayer, roadLayer, crashLayer]
    });


    var view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 10,
        center: [-95.35, 29.75],
        popup: {
            autoOpenEnabled: true,
        },
    });

    // Basic functions of the map
    const searchWidget = new Search({
        view: view
    });

    view.ui.move("zoom", "bottom-right");
    view.ui.add(searchWidget, {
        position: "top-trailing",
        index: 2
    });

    const scaleBar = new ScaleBar({
        view: view
    });

    view.ui.add(scaleBar, {
        position: "bottom-right",
        index: 3
    });

    const basemaps = new BasemapGallery({
        view,
        container: "basemaps-container"
    });

    const legend = new Legend({
        view,
        container: "legend-container"
    });
    const measurement = new AreaMeasurement2D({
        view,
        container: "measurement-container"
    });


    const print = new Print({
        view,
        container: "print-container"
    });

    const panel = document.getElementById("basemaps-container");
    const shellPanel = document.getElementById("shell-panel-end");
    const actions = shellPanel?.querySelectorAll("calcite-action");

    panel?.addEventListener("calcitePanelClose", function (event) {
        actions?.forEach(action => (action.active = false));
        shellPanel.collapsed = true;
    });

    actions?.forEach(el => {
        el.addEventListener("click", function (event) {
            actions?.forEach(action => (action.active = false));
            el.active = panel.closed;
            shellPanel.collapsed = !shellPanel.collapsed;
            panel.closed = !panel.closed;
            panel.heading = event.target.text;
        });
    });

    const timeSlider = new TimeSlider({
        container: "timeSlider",
        mode: "time-window",
        playRate: 50,
        stops: {
            interval: {
                value: 1,
                unit: "days"
            }
        },
        view: view
    });

    const sketchLayer = new GraphicsLayer();
    map.add(sketchLayer);
    let sketchGeometry = null;

    const sketchViewModel = new SketchViewModel({
        layer: sketchLayer,
        view: view,
        polygonSymbol: {
            type: "simple-fill",
            color: [150, 150, 150, 0.2],
            outline: {
                color: [50, 50, 50],
                width: 2
            }
        }
    });



    view.when(() => {

        let activeWidget;

        const handleActionBarClick = ({ target }) => {
            if (target.tagName !== "CALCITE-ACTION") {
                return;
            }
            const nextWidget = target.dataset.actionId;
            if (activeWidget) {
                document.querySelector(`[data-action-id=${activeWidget}]`).active = false;
                document.querySelector(`[data-panel-id=${activeWidget}]`).hidden = true;
            }

            if (nextWidget !== activeWidget) {
                document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
                document.querySelector(`[data-panel-id=${nextWidget}]`).hidden = false;
                activeWidget = nextWidget;
            } else {
                document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
                document.querySelector(`[data-panel-id=${nextWidget}]`).hidden = false;
            }
        };

        document.querySelector("calcite-action-bar").addEventListener("click", handleActionBarClick);

        let actionBarExpanded = false;

        document.addEventListener("calciteActionBarToggle", event => {
            actionBarExpanded = !actionBarExpanded;
            view.padding = {
                left: actionBarExpanded ? 150 : 49
            };
        });

        document.querySelector("calcite-shell").hidden = false;
        document.querySelector("calcite-loader").hidden = true;

    });

    ///////////////////////////////////////////////// define polygon selection ///////////////////////////////////
    sketchViewModel.on(["create"], (event) => {
        // update the filter every time the user finishes drawing the filtergeometry
        if (event.state == "complete") {
            sketchGeometry = event.graphic.geometry;
            updateFilter();
        }
    });

    sketchViewModel.on(["update"], (event) => {
        const eventInfo = event.toolEventInfo;
        // update the filter every time the user moves the filtergeometry
        if (event.toolEventInfo && event.toolEventInfo.type.includes("stop")) {
            sketchGeometry = event.graphics[0].geometry;
            updateFilter();
        }
    });

    document.getElementById("drawPolygon").onclick = geometryButtonsClickHandler;
    function geometryButtonsClickHandler(event) {
        //const geometryType = event.target.value;
        //clearFilter();
        view.closePopup();
        sketchViewModel.create("polygon");
    }

    let selectedFilter = "intersects";
    document.getElementById("relationship-select").addEventListener("change", (event) => {
        const select = event.target;
        selectedFilter = select.options[select.selectedIndex].value;
        updateFilter();
    });

    // // remove the filter
    document.getElementById("clearFilter").addEventListener("click", clearFilter);

    let layerViews = {};

    function storeLayerView(layerName, layerView) {
        layerViews[layerName] = layerView;
    }

    function removeLayerView(layerName) {
        if (layerViews[layerName]) {
            layerViews[layerName].filter.geometry = null;
            layerViews[layerName].filter.spatialRelationship = "intersects";// Remove the layer view entry
            delete layerViews[layerName];
            console.log(`LayerView for ${layerName} removed.`);
            console.log("left layerView is " + layerViews.length);
            //updateFilter();
        }
    }


    function clearFilter() {
        Object.values(layerViews).forEach(layerView => {
            if (layerView.filter) {
                layerView.filter.geometry = null;
                layerView.filter.spatialRelationship = "intersects"; // or reset as needed
            }
        });
        sketchLayer.removeAll();
        sketchGeometry = null;
        console.log("Filters cleared for all layers.");
    }


    function updateFilter() {

        Object.values(layerViews).forEach(layerView => {
            console.log("update filter output: " + layerView.layer.title)
                ; if (layerView.filter) {
                    layerView.filter.geometry = sketchGeometry;
                    layerView.filter.spatialRelationship = selectedFilter;
                } else {
                layerView.filter = {
                    geometry: sketchGeometry,
                    spatialRelationship: selectedFilter
                };
            }
        });
        console.log("Filters updated for all layers.");
    }

    document.querySelectorAll('.featureLayerViewFilter').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const layerName = e.target.name;
            const layer = tree_with_layer[layerName];

            console.log("Checkbox change for", layer.title, ":", e.target.checked);

            view.whenLayerView(layer).then(layerView => {
                storeLayerView(layerName, layerView);
                if (e.target.checked && layer.visible) {
                    updateFilter();  // Apply the filter to all stored LayerViews
                } else if (e.target.checked == false && layer.visible) {
                    console.log("ehrcunwheriucnwehfiunw")
                    removeLayerView(layerName);
                    //clearFilter();  // Clear the filter from all stored LayerViews
                }
                else {
                    clearFilter();
                }
            }).catch(console.error);
        });
    });

    document.getElementById("downloadFeatures").addEventListener("click", function () {
        Object.values(layerViews).forEach(layerView => {
            console.log("update filter output: " + layerView.layer.title)
            downloadFeatures(layerView);
        });
    });

    function downloadFeatures(layerView) {
        //console.log(layerView);
        if (!layerView) {
            console.error("LayerView not provided");
            return;
        }

        const query = layerView.layer.createQuery();
        query.where = layerView.filter.where;
        query.geometry = layerView.filter.geometry;
        query.spatialRelationship = layerView.filter.spatialRelationship;
        query.outFields = ["*"]; // Adjust as necessary for your application
        query.returnGeometry = true;

        layerView.layer.queryFeatures(query).then(function (results) {
            console.log("Length of features to download is " + results.features.length);
            const geoJson = convertFeaturesToGeoJSON(results.features);
            downloadGeoJSON(geoJson, "extracted_features.geojson");
        }).catch(console.error);
    }

    function convertFeaturesToGeoJSON(features) {
        return {
            type: "FeatureCollection",
            features: features.map(feature => ({
                type: "Feature",
                geometry: {
                    type: feature.geometry.type,
                    coordinates: feature.geometry.coordinates // Ensure this matches GeoJSON specification
                },
                properties: feature.attributes
            }))
        };
    }

    function downloadGeoJSON(geoJson, filename) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geoJson));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode); // Required for Firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    ///////////////////////////////////////////////// define chart ///////////////////////////////////

    let chart;
    let highlightHandle = null;
    let crashLayerView = null;
    let combinedExpression = "";
    initializeChart();

    document.querySelectorAll('calcite-tree[slot="children"]').forEach(tree => {
        tree.querySelectorAll('calcite-tree-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling

                // Toggle 'selected' attribute
                if (e.target.hasAttribute('selected')) {
                    e.target.removeAttribute('selected');
                } else {
                    e.target.setAttribute('selected', '');
                }

                // Re-apply filters based on new selection state
                currentExpression = getCombinedExpression(tree, tree.id);
                applyFiltersBasedOnSelection(tree);
            });
        });
    });




    function initializeChart() {
        if (chart) {
            console.log("Chart already initialized.");
            return;
        }
        console.log("Initializing chart.");
        const ctx = document.getElementById("CrashChart").getContext("2d");
        chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Possible Injury", "Unknown Injury", "Serious Injury", "Fatality"],
                datasets: [{
                    label: ["Count"],
                    backgroundColor: [
                        'rgba(201, 203, 207, 0.2)', // grey
                        'rgba(54, 162, 235, 0.2)', // blue
                        'rgba(255, 159, 64, 0.2)', //orange
                        'rgba(255, 99, 132, 0.2)', // red
                    ],

                    borderColor: [
                        'rgb(201, 203, 207)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 99, 132)',
                    ],
                    borderWidth: 1,
                    data: [0, 0, 0, 0]
                }]
            },
            options: {
                responsive: true,
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Crash Data Summary"
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
            }
        });
    }

    function updateChart(response) {
        const stats = response[0].value;
        console.log("response" + stats)
        const newData = [stats.poss_injuries, stats.unknown_injuries, stats.serious_injuries, stats.total_death];
        const totalCount = stats.poss_injuries + stats.unknown_injuries + stats.serious_injuries + stats.total_death;

        const title = totalCount + " injured and dead crash victims";

        if (!chart) {
            console.log("Initializing new chart since none exists.");
            initializeChart(); // Make sure this function sets up the chart correctly
        }

        console.log("Updating chart with new data.");
        chart.options.title.text = title;
        chart.data.datasets[0].data = newData;
        chart.update();
    }


    function getCombinedExpression(tree, layerID) {
        console.log("layerID: " + layerID)
        const selectedItems = tree.querySelectorAll('calcite-tree-item[selected]');
        const expressions = Array.from(selectedItems).map(item => {
            if (item.hasAttribute('expression')) {
                return item.getAttribute('expression');
            }
            else if (item.hasAttribute('data-filter')) {
                return "";
            }
            return null;
        }).filter(expr => expr !== null);

        layerExpressions[layerID] = expressions.join(' OR ');
        return layerExpressions[layerID];
    }

    var queryStatsOnDrag = promiseUtils.debounce((
        layerView,
        event,
        aggregateId
    ) => {
        // create a query object for the highlight and the statistics query
        console.log(layerView.layer.title)
        const query = layerView.createQuery();
        query.aggregateIds = [aggregateId];

        const statsQuery = query.clone();

        const statDefinitions = [

            {
                onStatisticField: "Poss_Injry_Cnt",
                outStatisticFieldName: "poss_injuries",
                statisticType: "sum"
            },
            {
                onStatisticField: "Unkn_Injry_Cnt",
                outStatisticFieldName: "unknown_injuries",
                statisticType: "sum"
            },
            {
                onStatisticField: "Incap_Injry_Cnt",
                outStatisticFieldName: "serious_injuries",
                statisticType: "sum"
            },
            {
                onStatisticField: "Death_Cnt",
                outStatisticFieldName: "total_death",
                statisticType: "sum"
            }
        ];

        // add the stat definitions to the the statistics query object cloned earlier
        statsQuery.outStatistics = statDefinitions;

        // execute the query for all features in the layer view
        const allStatsResponse = layerView.queryFeatures(statsQuery).then(
            function (response) {
                const stats = response.features[0].attributes;
                return stats;
            },
            function (e) {
                console.error(e);
            }
        );
        console.log(allStatsResponse);
        //openStatsQuery.where = "disposition = 'Open/No arrest'";

        // highlight all features within the query distance
        layerView.queryObjectIds(query).then(function (ids) {
            if (highlightHandle) {
                highlightHandle.remove();
                highlightHandle = null;
            }
            highlightHandle = layerView.highlight(ids);
        });

        // Return the promises that will resolve to each set of statistics
        return promiseUtils.eachAlways([
            allStatsResponse
        ]);
    });

    async function displayConvexHull(graphic, layerView) {
        processParams(graphic, layerView);

        const query = layerView.createQuery();
        query.aggregateIds = [graphic.getObjectId()];

        const { features } = await layerView.queryFeatures(query);
        const geometries = features.map((feature) => feature.geometry);
        const [convexHull] = geometryEngine.convexHull(geometries, true);
        const convexHullGraphic = {
            geometry: convexHull,
            symbol: {
                type: "simple-fill",
                outline: {
                    width: 1.5,
                    color: "yellow"
                },
                style: "none",
                color: [0, 0, 0, 0.1]
            }
        };
        view.graphics.add(convexHullGraphic);
    }

    function processParams(graphic, layerView) {
        if (!graphic || !layerView) {
            throw new Error("Graphic or layerView not provided.");
        }

        if (!graphic.isAggregate) {
            throw new Error("Graphic must represent a cluster.");
        }
    }

    function applyFiltersBasedOnSelection(tree) {
        const layer = tree_with_layer[tree.id];
        if (!layer) {
            console.error("Layer not found for tree:", tree.id);
            return;
        }

        const selectedItems = tree.querySelectorAll('calcite-tree-item[selected]');
        const expressions = Array.from(selectedItems).map(item => {
            if (item.hasAttribute('expression')) {
                return item.getAttribute('expression');
            }
            else if (item.hasAttribute('data-filter')) {
                return "";
            }
            return null;
        }).filter(expr => expr !== null);

        combinedExpression = expressions.join(' OR ');
        console.log("Applying filter to layer:", layer.title, combinedExpression);



        // Apply the filter to the layer's view
        view.whenLayerView(layer).then(layerView => {

            if (expressions.length > 0) {
                layerView.filter = new FeatureFilter({
                    where: combinedExpression
                });
                layer.visible = true;
                console.log(crashLayer.visible);
                if (crashLayer.visible && layer == crashLayer) {
                    crashLayerView = layerView;
                    view.ui.add(timeSlider, "bottom-left");

                    let crashExpression = layerExpressions["Crashes-Records"];
                    console.log("crashExpression is " + crashExpression);

                    const setupTimeSlider = async () => {
                        const start = new Date(2014, 0, 1);
                        const end = new Date(2023, 12, 1);
                        timeSlider.fullTimeExtent = {
                            start: start,
                            end: end
                        };
                        timeSlider.timeExtent = {
                            start: start,
                            end: crashLayer.timeInfo.fullTimeExtent.end
                        };
                    };
                    setupTimeSlider();
                    timeSlider.watch("timeExtent", function (timeExtent) {
                        // Define the minimum duration: 1 day in milliseconds
                        const oneDay = 24 * 60 * 60 * 1000;  // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds

                        const duration = timeExtent.end.getTime() - timeExtent.start.getTime();

                        if (duration < oneDay) {
                            // If the selected duration is less than one day, adjust the end date
                            const newEndTime = new Date(timeExtent.start.getTime() + oneDay);

                            // Set the new time extent with a minimum of one day
                            timeSlider.timeExtent = {
                                start: timeExtent.start,
                                end: newEndTime
                            };
                        }
                    });

                    reactiveUtils.when(() => !crashLayerView.updating, () => {
                        // Execute your logic once the layerView is no longer updating
                        view.on(["click"], async (event) => {
                            // event.stopPropagation();
                            const hitResponse = await view.hitTest(event, { include: layer });

                            if (hitResponse.results.length > 0) {
                                const graphic = hitResponse.results[0].graphic;

                                if (graphic.isAggregate) {
                                    try {
                                        const updateResults = await queryStatsOnDrag(crashLayerView, event, graphic.getObjectId());
                                        console.log(updateResults);
                                        updateChart(updateResults);
                                        clearViewGraphics();
                                        displayConvexHull(graphic, crashLayerView);
                                    } catch (error) {
                                        if (error.name !== "AbortError") {
                                            console.error("Error handling click event:", error);
                                        }
                                    }
                                }
                            }
                        });
                    });
                }
                if (sketchGeometry != null) {
                    updateFilter();
                }
            } else {
                layer.visible = false;
                if (layer == crashLayer) {
                    view.ui.remove(timeSlider);
                    clearViewGraphics();
                    view.closePopup();
                    resetChartData();
                    console.log("called clear graphics")
                }
            }


        });

        view.watch("scale", clearViewGraphics);
        function resetChartData() {
            if (chart) {
                chart.data.datasets.forEach((dataset) => {
                    dataset.data.fill(0);  // Fill all data points in the dataset with 0
                });
                chart.options.title.text = "Crash Data";
                chart.update();
            }
        }

        function clearViewGraphics() {
            console.log("clear graph")
            view.graphics.removeAll();
        }


    }

});

