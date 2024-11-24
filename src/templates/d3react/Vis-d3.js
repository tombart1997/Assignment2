import * as d3 from 'd3';

class VisD3 {
    margin = { top: 100, right: 5, bottom: 5, left: 100 };
    size;
    height;
    width;
    matSvg;
    scatterplotG;
    densityPlotG;
    scale1 = d3.scaleLinear(); // x-axis scale
    scale2 = d3.scaleLinear(); // y-axis scale
    colorScheme = d3.schemeYlGnBu[9];
    selectedData = []; // Store data selected via brushing

    constructor(el) {
        this.el = el;
    }

    create = function (config) {
        this.size = { width: config.size.width, height: config.size.height };

        // Calculate effective size of the view
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // Set the range for the scales
        this.scale1.range([0, this.width]);
        this.scale2.range([this.height, 0]); // Reverse y-axis for SVG

        // Initialize the SVG container
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height * 2 + this.margin.top + this.margin.bottom) // Double height for scatterplot + density plot
            .append("g")
            .attr("class", "matSvgG")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        // Add group for the scatterplot
        this.scatterplotG = this.matSvg.append("g")
            .attr("class", "scatterplotG");

        // Add group for the density plot (below scatterplot)
        this.densityPlotG = this.matSvg.append("g")
            .attr("class", "densityPlotG")
            .attr("transform", `translate(0, ${this.height + 50})`); // Position density plot below scatterplot

        // Add x and y axes for the scatterplot
        this.scatterplotG.append('g')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.scale1));

        this.scatterplotG.append('g')
            .call(d3.axisLeft(this.scale2));
    };

    renderVis = function (visData, controllerMethods) {
        const minVal_t = d3.min(visData, (d) => d.Temperature);
        const maxVal_t = d3.max(visData, (d) => d.Temperature);
        this.scale1.domain([minVal_t, maxVal_t]);

        const minVal_b = d3.min(visData, (d) => d.RentedBikeCount);
        const maxVal_b = d3.max(visData, (d) => d.RentedBikeCount);
        this.scale2.domain([minVal_b, maxVal_b]);

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
                        .attr("cx", (d) => this.scale1(d.Temperature))
                        .attr("cy", (d) => this.scale2(d.RentedBikeCount))
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

        // Render initial density plot with all data
        this.renderDensityPlot(visData);
    };

    updateFunction1 = function (selection) {
        selection.select("circle")
            .attr("cx", (d) => this.scale1(d.x))
            .attr("cy", (d) => this.scale2(d.y))
            .attr("fill", "red");
    };

    addScatterplotBrush = function (controllerMethods, visData) {
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("brush", ({ selection }) => {
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;

                    // Filter selected points
                    this.selectedData = visData.filter(d => {
                        const cx = this.scale1(d.Temperature);
                        const cy = this.scale2(d.RentedBikeCount);
                        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                    });

                    // Highlight selected scatterplot points
                    this.scatterplotG.selectAll("circle")
                        .attr("opacity", (d) => {
                            const cx = this.scale1(d.Temperature);
                            const cy = this.scale2(d.RentedBikeCount);
                            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1 ? 1 : 0.2;
                        });

                    // Update density plot with selected points
                    this.renderDensityPlot(this.selectedData);
                }
            })
            .on("end", ({ selection }) => {
                if (!selection) {
                    // Clear selection
                    this.selectedData = [];
                    this.scatterplotG.select(".brush").call(brush.move, null);
                    this.scatterplotG.selectAll("circle").attr("opacity", 1);

                    // Reset density plot
                    this.renderDensityPlot(visData);
                }
            });

        // Append brush to scatterplotG
        this.scatterplotG.append("g")
            .attr("class", "brush")
            .call(brush);
    };

    renderDensityPlot = function (data) {
        // Remove existing density plot
        this.densityPlotG.selectAll(".density-path").remove();

        // Create density generator
        const densityGenerator = d3.contourDensity()
            .x((d) => this.scale1(d.Temperature))
            .y((d) => this.scale2(d.RentedBikeCount))
            .size([this.width, this.height]) // Match size of the density plot area
            .bandwidth(20); // Adjust for smoothness

        const contours = densityGenerator(data);

        // Define color scale
        const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
            .domain([0, d3.max(contours, (d) => d.value)]);

        // Render density paths in the densityPlotG group
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
