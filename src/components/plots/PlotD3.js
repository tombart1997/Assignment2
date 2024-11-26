import * as d3 from 'd3';

class PlotD3 {
    margin = { top: 100, right: 5, bottom: 0, left: 50 };
    size;
    height;
    width;
    matSvg;
    scatterplotG;
    densityPlotG;
    scatterScaleX = d3.scaleLinear(); // Scatterplot x-axis scale
    scatterScaleY = d3.scaleLinear(); // Scatterplot y-axis scale
    densityScaleX = d3.scaleLinear(); // Density plot x-axis scale
    densityScaleY = d3.scaleLinear(); // Density plot y-axis scale
    selectedData = []; // Store data selected via brushing
    redrawTimeout; // Declare timeout for debouncing


    xAttr = 'Hour'; // Default x-axis attribute
    yAttr = 'RentedBikeCount'; // Default y-axis attribute

    constructor(el) {
        this.el = el;
    }

    setAxisAttributes = function (xAttr, yAttr) {
        this.xAttr = xAttr;
        this.yAttr = yAttr;
        this.updateLabels(); // Update labels dynamically

    };

    create = function (config, visData) {
        this.size = { width: config.size.width, height: config.size.height };
    
        // Calculate dimensions
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = (this.size.height - this.margin.top - this.margin.bottom) / 2;
    
        // Remove existing SVG (cleanup step)
        d3.select(this.el).selectAll("svg").remove();
    
        // Define ranges for both graphs
        this.scatterScaleX.range([0, this.width]);
        this.scatterScaleY.range([this.height, 0]); // Reverse y-axis
        this.densityScaleX.range([0, this.width]);
        this.densityScaleY.range([this.height, 0]);
        // Set domains based on the data
        const temperatureExtent = d3.extent(visData, (d) => d.Temperature);
        const rentedBikeCountExtent = d3.extent(visData, (d) => d.RentedBikeCount);
        this.scatterScaleX.domain(temperatureExtent);
        this.scatterScaleY.domain(rentedBikeCountExtent);

        this.densityScaleX.domain(temperatureExtent);
        this.densityScaleY.domain(rentedBikeCountExtent);
    
        // Initialize SVG
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", 1550)
            .attr("height", 550)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    
        // Add a clipPath to constrain the density plot without clipping the axes
        this.matSvg.append("clipPath")
            .attr("id", "clip-density")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", this.height);

    
        // Add scatterplot group
        this.scatterplotG = this.matSvg.append("g")
            .attr("class", "scatterplotG");


    
        // Add density plot group below scatterplot
        const densityContainer = this.matSvg.append("g")
            .attr("class", "densityContainer")
            .attr("transform", `translate(0, ${this.height + 50})`);



    
        this.densityPlotG = densityContainer.append("g")
            .attr("class", "densityPlotG")
            .attr("clip-path", "url(#clip-density)");


        
    
        // Add axes for density plot outside the clip-path
        densityContainer.append('g') // X-Axis
            .attr('class', 'densityplot-x-axis')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.densityScaleX));
    
        densityContainer.append('g') // Y-Axis
            .attr('class', 'densityplot-y-axis')
            .call(d3.axisLeft(this.densityScaleY));
    
        // Add axes for scatterplot
        this.scatterplotG.append('g') // X-Axis
            .attr('class', 'scatterplot-x-axis')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.scatterScaleX));
    
        this.scatterplotG.append('g') // Y-Axis
            .attr('class', 'scatterplot-y-axis')
            .call(d3.axisLeft(this.scatterScaleY));
    
        // Add axis labels
        this.scatterplotG.append("text")
            .attr("class", "x-axis-label scatterplot-x-axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40)
            .style("text-anchor", "middle");

        this.scatterplotG.append("text")
            .attr("class", "y-axis-label scatterplot-y-axis-label")
            .attr("x", -this.height / 2)
            .attr("y", -30)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle");

        densityContainer.append("text")
            .attr("class", "x-axis-label density-x-axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40)
            .style("text-anchor", "middle");

        densityContainer.append("text")
            .attr("class", "y-axis-label density-y-axis-label")
            .attr("x", -this.height / 2)
            .attr("y", -30)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle");

            
        this.updateLabels();


            setTimeout(() => {
                this.redrawAxes();
            }, 400);
            

    };
    
    updateLabels = function () {
        // Update scatterplot labels
        if (this.scatterplotG) {
            this.scatterplotG.select(".scatterplot-x-axis-label")
                .text(this.xAttr);
    
            this.scatterplotG.select(".scatterplot-y-axis-label")
                .text(this.yAttr);
        }
    
        // Update density plot labels
        if (this.matSvg) {
            this.matSvg.select(".density-x-axis-label")
                .text(this.xAttr);
    
            this.matSvg.select(".density-y-axis-label")
                .text(this.yAttr);
        }
    };
    
    

    redrawAxes = function () {
        // Redraw scatterplot axes
        this.scatterplotG.select('.scatterplot-x-axis')
            .call(d3.axisBottom(this.scatterScaleX).ticks(5).tickFormat(d3.format(".2f")));
    
        this.scatterplotG.select('.scatterplot-y-axis')
            .call(d3.axisLeft(this.scatterScaleY).ticks(5).tickFormat(d3.format(".2f")));
    
        // Redraw density plot axes
        d3.select('.densityplot-x-axis')
            .call(d3.axisBottom(this.densityScaleX).ticks(5).tickFormat(d3.format(".2f")));
    
        d3.select('.densityplot-y-axis')
            .call(d3.axisLeft(this.densityScaleY).ticks(5).tickFormat(d3.format(".2f")));
    };
    
    renderScatterPlot = function (visData, controllerMethods) {

        const processedData = visData.map((d, index) => ({
            ...d,
            x: d[this.xAttr],
            y: d[this.yAttr],
            index,
        }));

        // Calculate min and max for x values
        const minVal_t = d3.min(processedData, (d) => d.x);
        const maxVal_t = d3.max(processedData, (d) => d.x);
        this.scatterScaleX.domain([minVal_t, maxVal_t]);

        // Calculate min and max for y values
        const minVal_b = d3.min(processedData, (d) => d.y);
        const maxVal_b = d3.max(processedData, (d) => d.y);
        this.scatterScaleY.domain([minVal_b, maxVal_b]);
  


        this.scatterplotG.selectAll(".itemG")
            .data(processedData, (itemData) => itemData.index)
            .join(
                (enter) => {
                    const itemG = enter
                        .append("g")
                        .attr("class", "itemG")
                        .on("click", (event, itemData) => {
                            controllerMethods.handleOnEvent1(itemData);
                        })
                        .on("mouseover", (event, itemData) => {
                            controllerMethods.handleOnEvent2(itemData);
                        });

                    itemG.append("circle")
                        .attr("cx", (d) => this.scatterScaleX(d.x))
                        .attr("cy", (d) => this.scatterScaleY(d.y))
                        .attr("r", 2)
                        .attr("fill", "red");

                    this.updateFunction1(itemG);
                },
                (update) => {
                    this.updateFunction1(update);
                },
                (exit) => {
                    exit.remove();
                }
            );

        this.addScatterplotBrush(controllerMethods, visData);
        this.renderDensityPlot(visData);
    };


    updateFunction1 = function (selection) {
  
        selection.select("circle")
            .attr("cx", (d) => this.scatterScaleX(d.x))
            .attr("cy", (d) => this.scatterScaleY(d.y))
            .attr("fill", "blue");

    };

    addScatterplotBrush = function (controllerMethods, visData) {

        const processedData = visData.map((d, index) => ({
            ...d,
            x: d[this.xAttr],
            y: d[this.yAttr],
            index,
        }));
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]]) // Define the brushing area
            .on("brush", ({ selection }) => {
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;
    
                    // Update scatterplot scales
                    const newXDomain = [this.scatterScaleX.invert(x0), this.scatterScaleX.invert(x1)];
                    const newYDomain = [this.scatterScaleY.invert(y1), this.scatterScaleY.invert(y0)]; // Note y-axis is inverted
    
                    // Filter data based on the brush selection
                    this.selectedData = processedData.filter((d) => {
                        const cx = this.scatterScaleX(d.x);
                        const cy = this.scatterScaleY(d.y);
                        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                    });
    
                    // Highlight selected points in the scatterplot
                    this.scatterplotG.selectAll("circle")
                        .attr("opacity", (d) => {
                            const cx = this.scatterScaleX(d.x);
                            const cy = this.scatterScaleY(d.y);
                            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1 ? 1 : 0.2;
                        });
                    // Update density plot scales and render
                    this.densityScaleX.domain(newXDomain);
                    this.densityScaleY.domain(newYDomain);
                    this.renderDensityPlot(this.selectedData);
                }
            })
            .on("end", ({ selection }) => {
                if (!selection) {
                    // Reset everything when the brush is cleared
                    this.selectedData = [];
                    this.scatterplotG.selectAll("circle").attr("opacity", 1); // Reset opacity
                    this.densityScaleX.domain(this.scatterScaleX.domain());
                    this.densityScaleY.domain(this.scatterScaleY.domain());
                    this.renderDensityPlot(visData); // Render full density plot
                }
            });
    
        // Append the brush to the scatterplot group
        this.scatterplotG.append("g")
            .attr("class", "brush")
            .call(brush);
    };

    renderDensityPlot = function (visData) {
        const processedData = visData.map((d, index) => ({
            ...d,
            x: d[this.xAttr],
            y: d[this.yAttr],
            index,
        }));
    
        if (this.redrawTimeout) clearTimeout(this.redrawTimeout);
        this.redrawTimeout = setTimeout(() => {
            if (!processedData || processedData.length === 0) {
                // Set density plot scales to match scatterplot scales if no data
                this.densityScaleX.domain(this.scatterScaleX.domain());
                this.densityScaleY.domain(this.scatterScaleY.domain());
            } else {
                // Update scales to match the data extent
                this.densityScaleX.domain(d3.extent(processedData, (d) => d.x));
                this.densityScaleY.domain(d3.extent(processedData, (d) => d.y));
            }
    
            // Clear any existing density paths
            this.densityPlotG.selectAll(".density-path").remove();
    
            // Create a density generator
            const densityGenerator = d3.contourDensity()
                .x((d) => this.densityScaleX(d.x))
                .y((d) => this.densityScaleY(d.y))
                .size([this.width, this.height])
                .bandwidth(20);
    
            const contours = densityGenerator(processedData);
    
            // Define a color scale for the density plot
            const colorScale = d3.scaleSequential(d3.interpolateViridis)
                .domain([0, d3.max(contours, (d) => d.value)]);
    
            // Render the density plot
            this.densityPlotG.selectAll(".density-path")
                .data(contours)
                .join("path")
                .attr("class", "density-path")
                .attr("d", d3.geoPath())
                .attr("fill", (d) => colorScale(d.value))
                .attr("stroke", "none")
                .attr("opacity", 0.7);
    
            // Render all data points as circles
            this.densityPlotG.selectAll("circle")
                .data(processedData)
                .join("circle")
                .attr("class", "data-point")
                .attr("cx", (d) => this.densityScaleX(d.x))
                .attr("cy", (d) => this.densityScaleY(d.y))
                .attr("r", 1)
                .attr("fill", "white")
                .attr("opacity", 0.5);
    
            // Add brush functionality to the density plot
            this.addBrushToDensityPlot(processedData);
    
            // Optionally redraw axes to reflect updated scales
            setTimeout(() => {
                this.redrawAxes();
            }, 100);
        }, 50);
    };
    
    

    

    addBrushToDensityPlot = function (visData) {
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]]) // Define the brushing area
            .on("brush", ({ selection }) => {
                if (!selection || selection.length < 2) {
                    console.warn("Brush selection is invalid or undefined");
                    return;
                }
    
                const [[x0, y0], [x1, y1]] = selection;
    
                // Map the brushed area to the density plot's scales
                const newXDomain = [this.densityScaleX.invert(x0), this.densityScaleX.invert(x1)];
                const newYDomain = [this.densityScaleY.invert(y1), this.densityScaleY.invert(y0)];
    
                // Filter the data within the selected area
                this.selectedData = visData.filter((d) => {
                    const cx = this.densityScaleX(d.x);
                    const cy = this.densityScaleY(d.y);
                    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                });
    
                // Optionally highlight the selected region in the density plot
                this.densityPlotG.selectAll(".density-path")
                    .attr("opacity", (d) => {
                        if (!d.coordinates || !d.coordinates[0]) return 0.3;
    
                        const contourMidX = d3.mean(d.coordinates[0].map((point) => point[0]));
                        const contourMidY = d3.mean(d.coordinates[0].map((point) => point[1]));
    
                        return x0 <= contourMidX && contourMidX <= x1 && y0 <= contourMidY && contourMidY <= y1
                            ? 1
                            : 0.3;
                    });
    
                // Highlight corresponding points in the scatterplot
                this.scatterplotG.selectAll("circle")
                    .attr("fill", (d) =>
                        this.selectedData.some(
                            (selected) => selected.x === d.x && selected.y === d.y
                        )
                            ? "red" // Highlighted color
                            : "blue" // Default color
                    )
                    .attr("opacity", (d) =>
                        this.selectedData.some(
                            (selected) => selected.x === d.x && selected.y === d.y
                        )
                            ? 1
                            : 0.2 // Dim non-selected points
                    );
            })
            .on("end", ({ selection }) => {
                if (!selection) {
                    // Reset everything when the brush is cleared
                    this.selectedData = [];
                    this.densityPlotG.selectAll(".density-path").attr("opacity", 1); // Reset density plot
                    this.scatterplotG.selectAll("circle").attr("fill", "red").attr("opacity", 1); // Reset scatterplot points
                }
            });
    
        // Append the brush to the density plot group
        this.densityPlotG.append("g")
            .attr("class", "density-brush")
            .call(brush);
    };


    clear = function () {
        d3.select(this.el).selectAll("*").remove();
    };
}

export default PlotD3;
