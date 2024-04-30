
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
    "esri/widgets/BasemapGallery",
    "esri/widgets/Legend",
    "esri/widgets/AreaMeasurement2D",
    "esri/widgets/Print",
    "esri/widgets/Search",
    "esri/widgets/ScaleBar",
    "esri/widgets/TimeSlider",
    "esri/widgets/Expand",
    "esri/layers/support/FeatureFilter",
    "esri/layers/support/LabelClass",
    "esri/layers/support/AggregateField",
    "esri/core/reactiveUtils"
], function (Map, MapView, GeoJSONLayer, BasemapGallery, Legend, AreaMeasurement2D, Print, Search, ScaleBar, TimeSlider, Expand, FeatureFilter, LabelClass, AggregateField, reactiveUtils) {
    // Add layers to the map
    // Define the bin map of the crash layer
    // Esri color ramps - Esri Yellow and Green 1
// #beac2dff,#e8d966ff,#fff58fff,#00bab5ff,#00807dff
    const colors = ["#beac2dff", "#e8d966ff", "#fff58fff", "#00bab5ff", "#00807dff"];

    const featureReduction = {
        type: "binning",
        fixedBinLevel: 6,

        fields: [
            new AggregateField({
                name: "aggregateCount",
                statisticType: "count"
            }),
            new AggregateField({
                name: "AverageCrashSpeed",
                alias: "Average Crash Speed",
                onStatisticField: "Crash_Spee",
                statisticType: "avg"
            }),
            new AggregateField({
                name: "SumInjuries",
                alias: "Number of injuries",
                onStatisticField: "Tot_Injry_",
                statisticType: "sum"
            }),
            new AggregateField({
                name: "SumDeath",
                alias: "Number of fatality",
                onStatisticField: "Death_Cnt",
                statisticType: "sum"
            }),
            new AggregateField({
                name: "SumPedestrianInvolved",
                alias: "Number of crashes with pedestrians involved",
                onStatisticField: "VZ_PedCoun",
                statisticType: "sum"
            }),
            new AggregateField({
                name: "SumBikeInvolved",
                alias: "Number of crashes with bicyclist involved",
                onStatisticField: "VZ_BikeCou",
                statisticType: "sum"
            }),
        ],
        labelsVisible: true,
        labelingInfo: [
            new LabelClass({
                minScale: 36112,
                maxScale: 0,
                deconflictionStrategy: "none",
                symbol: {
                    type: "text",  // autocasts as new TextSymbol()
                    color: "white",
                    font: {
                        family: "Noto Sans",
                        size: 12,
                        weight: "bold"
                    },
                    haloColor: colors[4],
                    haloSize: 0.5
                },
                labelExpressionInfo: {
                    expression: "Text($aggregateCount)"
                }
            })
        ],
        popupEnabled: true,
        popupTemplate: {
            title: "Crash summary",
            content: [{
                type: "text",
                text: "{aggregateCount} car crashes occurred in this area."
            }, {
                type: "fields",
                fieldInfos: [{
                    fieldName: "aggregateCount",
                    label: "Total crashes",
                    format: {
                        places: 0,
                        digitSeparator: true
                    }
                }, {
                    fieldName: "AverageCrashSpeed",
                    label: "Average Crash Speed",
                }, {
                    fieldName: "SumInjuries",
                    label: "Number of Injuries"
                }, {
                    fieldName: "SumDeath",
                    label: "Number of Death"
                }, {
                    fieldName: "SumPedestrianInvolved",
                    label: "Number of Crashes with Pedestrians Involved"
                }, {
                    fieldName: "SumBikeInvolved",
                    label: "Number of Crashes with Bicyclists Involved"
                }]
            }]
        },
        renderer: {
            type: "simple",
            symbol: {
                type: "simple-marker",
                color: [0, 255, 71, 1],
                outline: null,
                outline: {
                    color: "rgba(153, 31, 23, 0.3)",
                    width: 0.3,
                },
            },
            visualVariables: [
                {
                    type: "size",
                    field: "aggregateCount",
                    legendOptions: {
                        title: "Total crashes"
                    },
                    minSize: {
                        type: "size",
                        valueExpression: "$view.scale",
                        stops: [
                            { value: 1, size: 18 },
                            { value: 10, size: 12 },
                            { value: 20, size: 8 },
                            { value: 30, size: 4 },
                            { value: 40, size: 2 },
                            { value: 60, size: 1 },
                        ]
                    },
                    maxSize: {
                        type: "size",
                        valueExpression: "$view.scale",
                        stops: [
                            { value: 1, size: 6 },
                            { value: 10, size: 12 },
                            { value: 20, size: 18 },
                            { value: 30, size: 25 },
                            { value: 40, size: 36 },
                            { value: 60, size: 48 },
                        ]
                    },
                    minDataValue: 1,
                    maxDataValue: 100
                },
                {
                    type: "color",
                    field: "SumInjuries",
                    legendOptions: {
                        title: "Total Number of Injuries"
                    },
                    stops: [
                        { value: 0, color: colors[0], label: "No injuries" },
                        { value: 10, color: colors[1] },
                        { value: 20, color: colors[2], label: "5" },
                        { value: 30, color: colors[3] },
                        { value: 40, color: colors[4], label: ">10" }
                    ]
                }
            ]
        }
    };

    const clusterConfig = {
        type: "cluster",
        clusterRadius: "100px",
        // {cluster_count} is an aggregate field containing
        // the number of features comprised by the cluster
        
        popupTemplate: {
          title: "Cluster summary",
          content: "This cluster represents {cluster_count} crashes.",
          fieldInfos: [{
            fieldName: "cluster_count",
            format: {
              places: 0,
              digitSeparator: true
            }
          }]
        },
        clusterMinSize: "24px",
        clusterMaxSize: "60px",
        labelingInfo: [{
          deconflictionStrategy: "none",
          labelExpressionInfo: {
            expression: "Text($feature.cluster_count, '#,###')"
          },
          symbol: {
            type: "text",
            color: "#004a5d",
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
        url: "data/STARMAP_Clean.geojson",
        title: "Roads",
        popupTemplate: {
            title: "{Full_Name}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "RoadClass",
                            label: "Road Class"
                        },
                        {
                            fieldName: "OneWay",
                            label: "One Way",
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
                width: 0.5
            },
            label: "Length of Roads",
            visualVariables: [
                {
                    type: "color",
                    field: "Shape_Leng",
                    //normalizationField: 
                    stops: [
                        {
                            value: 500, // features where < 10% of the pop in poverty
                            color: "#b35116ff", // will be assigned this color (beige)
                            label: "< 500" // label to display in the legend
                        },
                        {
                            value: 1500, // features where > 30% of the pop in poverty
                            color: "#00619bff", // will be assigned this color (purple)
                            label: "< 1500" // label to display in the legend
                        }
                    ]
                }
            ]
        },
        outFields: ["Shape_Leng"]
    });

    var crashLayer = new GeoJSONLayer({
        url: "data/Crashes2018_2022.geojson",
        title: "Crashes (2018-2022)",
        featureReduction: featureReduction,
        timeInfo: {
            startField: "Crash_Date",
            interval: {
                unit: "years",
                value: 1
            }
        },
        popupTemplate: {
            title: "Crash {Crash_ID}",
            content: "Happened on {Rpt_Stre_1} {Rpt_Stre_2} on {Crash_Date}",
            fieldInfos: [
              {
                fieldName: "time",
                format: {
                  dateFormat: "short-date-short-time"
                }
              }
            ]
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
        visible: false
    });

    const tree_with_layer = {
        "safety-index": roadLayer,
        "Crashes-Records": crashLayer // Ensure this ID matches your HTML
    };

    var layerExpressions = {
        "safety-index": "",
        "Crashes-Records": ""
    };

    var map = new Map({
        basemap: "gray",
        layers: [roadLayer, crashLayer]
    });


    var view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 10,
        center: [-95.35, 29.75]
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
                unit: "months"
            }
        },
        view: view
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

    ///////////////////////////////////////////////// define chart ///////////////////////////////////

    let chart;
    let currentExpression = '';
    let crashLayerView = null;
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
                console.log("here is first currentExpression: "+currentExpression)
                applyFiltersBasedOnSelection(tree);
            });
        });
    });

    function queryLayerViewStats(layerView, sqlExpression) {

        console.log("sql expression is "+ sqlExpression);
        const crashFields = [
            "Death_Cnt",
            "Tot_Injry_"
        ];

        // Creates a query object for statistics of each of the fields listed above
        const statDefinitions = crashFields.map(function (fieldName) {
            return {
                onStatisticField: fieldName,
                outStatisticFieldName: fieldName + "_TOTAL",
                statisticType: "sum"
            };
        });

        // query statistics for features only in view extent
        const query = layerView.layer.createQuery();
        query.where = sqlExpression;
        query.timeExtent = timeSlider.timeExtent;
        query.outStatistics = statDefinitions;
        query.geometry = view.extent;

        // query features within the view's extent on the client
        return layerView.queryFeatures(query).then(function (response) {
            const stats = response.features[0].attributes;

            const updatedData = [
                // stats.Poss_Injry_TOTAL,
                // stats.Non_Injry__TOTAL,
                // stats.Unkn_Injry_TOTAL,
                stats.Death_Cnt_TOTAL,
                stats.Tot_Injry__TOTAL
            ];
            console.log(stats.Death_Cnt_TOTAL, stats.Tot_Injry__TOTAL)
            // data used to update the pie chart
            return {
                total: stats.Tot_Injry__TOTAL + stats.Death_Cnt_TOTAL,
                values: updatedData
            };
        });
    }
    
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
                labels: ["Total Fatalities","Total Injuries"],
                datasets: [{
                    label: ["Death Count","Total Injuries"],
                    backgroundColor: ['rgba(255, 99, 132, 0.2)',
                    'rgba(255, 159, 64, 0.2)'],
                    borderColor: ['rgb(255, 99, 132)',
                    'rgb(255, 159, 64)'],
                    borderWidth: 1,
                    data: [0, 0]
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
                }
            }
        });
    }

    function updateChart(response) {
        const newData = response.values;
        totalCount = response.total;
        const title = totalCount + " injured and dead crash victims";
        if (!chart) {
            initializeChart();
        } else {
            console.log("chart exists. Updating it")
            chart.options.title.text = title;
            chart.data.datasets[0].data = newData;
            chart.update();
        }
    }
    
    
    function getCombinedExpression(tree, layerID) {
        console.log(layerID)
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

        const combinedExpression = expressions.join(' OR ');
        console.log("Applying filter to layer:", layer.title, combinedExpression);
        
        
        
        // Apply the filter to the layer's view
        view.whenLayerView(layer).then(layerView => {

            if (expressions.length > 0) {
                layerView.filter = new FeatureFilter({
                    where: combinedExpression
                });
                layer.visible = true;
                
                if (crashLayer.visible && layer == crashLayer) {
                    crashLayerView = layerView;
                    view.ui.add(timeSlider, "top-left");
                    let crashExpression = layerExpressions["Crashes-Records"];
                    console.log("crashExpression is "+crashExpression);
                    
                    const setupTimeSlider = async () => {
                        const start = new Date(2017, 12);
                        const end = new Date(2022, 12);
                        timeSlider.fullTimeExtent = {
                            start: start,
                            end: end
                        };
                        timeSlider.timeExtent = {
                            start: start,
                            end: layer.timeInfo.fullTimeExtent.end
                        };
                    };
                    setupTimeSlider();
                    reactiveUtils.when(() => !crashLayerView.updating, () => {
                        
                        console.log("Reactive update triggered");
                        if (crashExpression) {
                            queryAndUpdate(crashExpression);
                        }
                    });
                    
                    timeSlider.watch("timeExtent", () => {
                        console.log("Time extent change triggered");
                        if (crashExpression) {
                            queryAndUpdate(crashExpression);
                        }
                    });

                    function queryAndUpdate(expression) {
                        if (crashLayerView && expression) {
                            console.log("Querying with expression:", crashExpression);
                            queryLayerViewStats(crashLayerView, crashExpression).then(newData => {
                                updateChart(newData);
                            });
                        }
                    }
                }
            } else {
                layer.visible = false;
                if (layer == crashLayer) {
                    view.ui.remove(timeSlider);
                }
            }


        });
    }

});

