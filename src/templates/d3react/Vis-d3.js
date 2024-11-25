import * as d3 from 'd3';

class VisD3 {
    margin = { top: 100, right: 5, bottom: 0, left: 50 };
    size;
    height;
    width;
    matSvg;
    scatterplotG;
    densityPlotG;
    scaleX = d3.scaleLinear().range([0, this.width]); // Scatterplot x-axis scale
    scaleY = d3.scaleLinear().range([this.height, 0]);
    selectedData = []; // Store data selected via brushing
    xAttr = 'Hour'; // Default x-axis attribute
    yAttr = 'RentedBikeCount'; // Default y-axis attribute

    constructor(el) {
        this.el = el;
    }

    setAxisAttributes = function (xAttr, yAttr) {
        console.log('Setting Axis Attributes:', { xAttr, yAttr }); // Log axis attributes
        this.xAttr = xAttr;
        this.yAttr = yAttr;
    };

    create = function (config, visData) {
        console.log('Creating visualization with data:', visData.slice(0, 5)); // Log first 5 rows of data for reference
        this.size = { width: config.size.width, height: config.size.height };

        // Calculate dimensions
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = (this.size.height - this.margin.top - this.margin.bottom) / 2;

        // Remove existing SVG (cleanup step)
        d3.select(this.el).selectAll("svg").remove();

        // Define ranges for the scatterplot
        this.scaleX.range([0, this.width]);
        this.scaleY.range([this.height, 0]);

        // Set domains based on the data
        const xExtent = d3.extent(visData, (d) => d[this.xAttr]);
        const yExtent = d3.extent(visData, (d) => d[this.yAttr]);
        this.scaleX.domain(xExtent);
        this.scaleY.domain(yExtent);

        console.log('X Extent:', xExtent, 'Y Extent:', yExtent); // Log axis extents

        // Initialize SVG
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", 1550)
            .attr("height", 850)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        // Add scatterplot group
        this.scatterplotG = this.matSvg.append("g")
            .attr("class", "scatterplotG");

        // Add brush layer
        this.addScatterplotBrush(visData);

        // Render scatterplot
        this.renderScatterPlot(visData);

        setTimeout(() => {
            this.redrawAxes();
        }, 400);
    };

    redrawAxes = function () {
        // Redraw scatterplot axes
        this.scatterplotG.select('.scatterplot-x-axis')
            .call(d3.axisBottom(this.scaleX).ticks(5).tickFormat(d3.format(".2f")));

        this.scatterplotG.select('.scatterplot-y-axis')
            .call(d3.axisLeft(this.scaleY).ticks(5).tickFormat(d3.format(".2f")));
    };

    renderScatterPlot = function (visData) {
        console.log('Rendering scatterplot with attributes:', { xAttr: this.xAttr, yAttr: this.yAttr }); // Log attributes
        console.log('Sample data before processing:', visData.slice(0, 5)); // Log sample data
    
        const processedData = visData
            .map((d, index) => ({
                ...d,
                x: d[this.xAttr],
                y: d[this.yAttr],
                index,
            }));
    
        const minVal_t = d3.min(processedData, (d) => d.x);
        const maxVal_t = d3.max(processedData, (d) => d.x);
        this.scaleX.domain([minVal_t, maxVal_t]);
    
        const minVal_b = d3.min(processedData, (d) => d.y);
        const maxVal_b = d3.max(processedData, (d) => d.y);
        this.scaleY.domain([minVal_b, maxVal_b]);
    
        console.log("X Min:", minVal_t, "X Max:", maxVal_t);
        console.log("Y Min:", minVal_b, "Y Max:", maxVal_b);
    
        console.log('Processed Data:', processedData.slice(0, 5)); // Log processed data sample
    
        this.scatterplotG.selectAll("circle")
            .data(processedData, (d) => d.index)
            .join(
                (enter) => enter.append("circle")
                    .attr("cx", (d) => this.scaleX(d.x))
                    .attr("cy", (d) => this.scaleY(d.y))
                    .attr("r", 4)
                    .attr("fill", "blue"),
                (update) => update
                    .attr("cx", (d) => this.scaleX(d.x))
                    .attr("cy", (d) => this.scaleY(d.y))
                    .attr("fill", "blue"),
                (exit) => exit.remove()
            );
    };
    

    addScatterplotBrush = function (visData) {
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]]) // Define the brushing area
            .on("start", () => {
                // Temporarily disable pointer-events for the points

                this.scatterplotG.selectAll("circle").style("pointer-events", "none");
            })
            .on("brush", ({ selection }) => {
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;

                    // Filter data within the brushed area
                    this.selectedData = visData.filter((d) => {
                        const cx = this.scaleX(d[this.xAttr]);
                        const cy = this.scaleY(d[this.yAttr]);
                        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                    });
                    console.log('Selected Data:', this.selectedData.slice(0, 5)); // Log selected data sample


                    // Highlight selected points
                    this.scatterplotG.selectAll("circle")
                        .attr("opacity", (d) =>
                            this.selectedData.includes(d) ? 1 : 0.2
                        );
                }
            })
            .on("end", ({ selection }) => {
                // Re-enable pointer-events for the points
                this.scatterplotG.selectAll("circle").style("pointer-events", "all");

                if (!selection) {
                    // Reset selection
                    this.selectedData = [];
                    this.scatterplotG.selectAll("circle").attr("opacity", 1); // Reset all points
                }
            });

        // Add the brush as a background layer
        this.scatterplotG.insert("g", ":first-child") // Ensure the brush is below the points
            .attr("class", "brush")
            .call(brush)
            .style("pointer-events", "all");
    };

    clear = function () {
        d3.select(this.el).selectAll("*").remove();
    };
}

export default VisD3;
