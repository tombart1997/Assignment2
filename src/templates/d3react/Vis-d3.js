import * as d3 from 'd3';

class VisD3 {
    margin = { top: 100, right: 5, bottom: 5, left: 100 };
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
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // Define ranges for both graphs
        this.scatterScaleX.range([0, this.width]);
        this.scatterScaleY.range([this.height, 0]); // Reverse y-axis
        this.densityScaleX.range([0, this.width]);
        this.densityScaleY.range([this.height, 0]);

        // Initialize SVG
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height * 2 + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class", "matSvgG")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        // Add scatterplot group
        this.scatterplotG = this.matSvg.append("g")
            .attr("class", "scatterplotG");

        // Add density plot group below the scatterplot
        this.densityPlotG = this.matSvg.append("g")
            .attr("class", "densityPlotG")
            .attr("transform", `translate(0, ${this.height + 50})`);

        // Add axes for scatterplot
        this.scatterplotG.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.scatterScaleX));

        this.scatterplotG.append('g')
            .call(d3.axisLeft(this.scatterScaleY));
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

                    // Filter the data within the selected rectangle
                    this.selectedData = visData.filter((d) => {
                        const cx = this.scatterScaleX(d.Temperature);
                        const cy = this.scatterScaleY(d.RentedBikeCount);
                        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                    });

                    // Highlight the selected points in the scatterplot
                    this.scatterplotG.selectAll("circle")
                        .attr("opacity", (d) => {
                            const cx = this.scatterScaleX(d.Temperature);
                            const cy = this.scatterScaleY(d.RentedBikeCount);
                            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1 ? 1 : 0.2;
                        });

                    // Update the density plot with the selected data
                    this.renderDensityPlot(this.selectedData);
                }
            })
            .on("end", ({ selection }) => {
                if (!selection) {
                    // Reset everything if the brush selection is cleared
                    this.selectedData = [];
                    this.scatterplotG.selectAll("circle").attr("opacity", 1); // Reset scatterplot points
                    //this.renderDensityPlot(visData);
                }
            });

        // Append the brush to the scatterplot group
        this.scatterplotG.append("g")
            .attr("class", "brush")
            .call(brush);
    };

    renderDensityPlot = function (visData) {
        // Update density plot scales
        const minVal_t = d3.min(visData, (d) => d.Temperature);
        const maxVal_t = d3.max(visData, (d) => d.Temperature);
        this.densityScaleX.domain([minVal_t, maxVal_t]);

        const minVal_b = d3.min(visData, (d) => d.RentedBikeCount);
        const maxVal_b = d3.max(visData, (d) => d.RentedBikeCount);
        this.densityScaleY.domain([minVal_b, maxVal_b]);

        // Clear any existing density paths in the density plot group
        this.densityPlotG.selectAll(".density-path").remove();

        // Create a density generator using the filtered data
        const densityGenerator = d3.contourDensity()
            .x((d) => this.densityScaleX(d.Temperature))
            .y((d) => this.densityScaleY(d.RentedBikeCount))
            .size([this.width, this.height])
            .bandwidth(20);

        const contours = densityGenerator(visData);

        // Define a color scale for the density plot
        const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
            .domain([0, d3.max(contours, (d) => d.value)]);

        // Render the density plot in the densityPlotG group
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
