import * as d3 from 'd3';

class VisD3 {
    margin = { top: 0, right: 5, bottom: 0, left: 50 };
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

    constructor(el) {
        this.el = el;
    }
    
    create = function (config) {
        this.size = { width: config.size.width, height: config.size.height };
    
        // Calculate dimensions
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = (this.size.height - this.margin.top) / 2; // Divide evenly between plots
    
        // Define ranges for both graphs
        this.scatterScaleX.range([0, this.width]);
        this.scatterScaleY.range([this.height, 0]); // Reverse y-axis
        this.densityScaleX.range([0, this.width]);
        this.densityScaleY.range([this.height, 0]);
    
        // Initialize SVG
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height * 2 + this.margin.top) // Adjusted height
            .append("g")
            .attr("class", "matSvgG")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    
        // Add scatterplot group
        this.scatterplotG = this.matSvg.append("g")
            .attr("class", "scatterplotG");
    
        // Add density plot group below scatterplot
        this.densityPlotG = this.matSvg.append("g")
            .attr("class", "densityPlotG")
            .attr("transform", `translate(0, ${this.height})`);
    
        // Add axes for scatterplot (ONLY ONCE)
        this.scatterplotG.append('g') // X-Axis
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.scatterScaleX));
    
        this.scatterplotG.append('g') // Y-Axis
            .call(d3.axisLeft(this.scatterScaleY));
    
        // Add axes for density plot (ONLY ONCE)
        this.densityPlotG.append('g') // X-Axis
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.densityScaleX));
    
        this.densityPlotG.append('g') // Y-Axis
            .call(d3.axisLeft(this.densityScaleY));
    
        // Add x-axis label for scatterplot
        this.scatterplotG.append("text")
            .attr("class", "x-axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40) // Position below the x-axis
            .style("text-anchor", "middle")
            .text("Temperature (°C)");
    
        // Add y-axis label for scatterplot
        this.scatterplotG.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -this.height / 2)
            .attr("y", -40) // Position to the left of the y-axis
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("Rented Bike Count");
    
        // Add x-axis label for density plot
        this.densityPlotG.append("text")
            .attr("class", "x-axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40) // Position below the x-axis
            .style("text-anchor", "middle")
            .text("Temperature (°C)");
    
        // Add y-axis label for density plot
        this.densityPlotG.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -this.height / 2)
            .attr("y", -40) // Position to the left of the y-axis
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("Density");
    };
    
    

    addZoom = function () {
        const zoom = d3.zoom()
            .scaleExtent([1, 10]) // Define zoom limits
            .translateExtent([[0, 0], [this.width, this.height * 2]]) // Allow zooming over the full area
            .on("zoom", (event) => {
                const transform = event.transform;
    
                // Rescale the scatterplot and density scales
                const newX = transform.rescaleX(this.scatterScaleX);
                const newY = transform.rescaleY(this.scatterScaleY);
    
                this.scatterScaleX.domain(newX.domain());
                this.scatterScaleY.domain(newY.domain());
    
                this.densityScaleX.domain(newX.domain());
                this.densityScaleY.domain(newY.domain());
    
                // Redraw scatterplot
                this.scatterplotG.selectAll("circle")
                    .attr("cx", (d) => this.scatterScaleX(d.Temperature))
                    .attr("cy", (d) => this.scatterScaleY(d.RentedBikeCount));
    
                this.scatterplotG.select(".x-axis").call(d3.axisBottom(this.scatterScaleX));
                this.scatterplotG.select(".y-axis").call(d3.axisLeft(this.scatterScaleY));
    
                // Redraw density plot
                this.renderDensityPlot(this.selectedData.length ? this.selectedData : this.fullData);
            });
    
        d3.select(this.el).call(zoom);
    };
    

    renderScatterPlot = function (visData, controllerMethods) {
        const minVal_t = d3.min(visData, (d) => d.Temperature);
        const maxVal_t = d3.max(visData, (d) => d.Temperature);
        this.scatterScaleX.domain([minVal_t, maxVal_t]);

        const minVal_b = d3.min(visData, (d) => d.RentedBikeCount);
        const maxVal_b = d3.max(visData, (d) => d.RentedBikeCount);
        this.scatterScaleY.domain([minVal_b, maxVal_b]);

        const processedData = visData.map((d, index) => ({
            ...d,
            x: d.Temperature,
            y: d.RentedBikeCount,
            index,
        }));

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
                        .attr("cx", (d) => this.scatterScaleX(d.Temperature))
                        .attr("cy", (d) => this.scatterScaleY(d.RentedBikeCount))
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
    };

    updateFunction1 = function (selection) {
        selection.select("circle")
            .attr("cx", (d) => this.scatterScaleX(d.x))
            .attr("cy", (d) => this.scatterScaleY(d.y))
            .attr("fill", "red");
    };

    addScatterplotBrush = function (controllerMethods, visData) {
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]]) // Define the brushing area
            .on("brush", ({ selection }) => {
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;
    
                    // Update scatterplot scales
                    const newXDomain = [this.scatterScaleX.invert(x0), this.scatterScaleX.invert(x1)];
                    const newYDomain = [this.scatterScaleY.invert(y1), this.scatterScaleY.invert(y0)]; // Note y-axis is inverted
    
                    // Filter data based on the brush selection
                    this.selectedData = visData.filter((d) => {
                        const cx = this.scatterScaleX(d.Temperature);
                        const cy = this.scatterScaleY(d.RentedBikeCount);
                        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                    });
    
                    // Highlight selected points in the scatterplot
                    this.scatterplotG.selectAll("circle")
                        .attr("opacity", (d) => {
                            const cx = this.scatterScaleX(d.Temperature);
                            const cy = this.scatterScaleY(d.RentedBikeCount);
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
        // Set density plot scales to match scatterplot
        this.densityScaleX.domain(this.scatterScaleX.domain());
        this.densityScaleY.domain(this.scatterScaleY.domain());
    
        // Clear any existing density paths
        this.densityPlotG.selectAll(".density-path").remove();
    
        // Create a density generator
        const densityGenerator = d3.contourDensity()
            .x((d) => this.densityScaleX(d.Temperature))
            .y((d) => this.densityScaleY(d.RentedBikeCount))
            .size([this.width, this.height])
            .bandwidth(20);
    
        const contours = densityGenerator(visData);
    
        // Define a color scale for the density plot
        const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
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
    };
    


    clear = function () {
        d3.select(this.el).selectAll("*").remove();
    };
}

export default VisD3;
