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
        this.updateLabels(); // Update labels dynamically

    };


    create = function (config, visData) {
        console.log('Creating visualization with data:', visData.slice(0, 5)); // Log first 5 rows of data for reference
        this.size = { width: config.size.width, height: config.size.height };
    
        // Calculate dimensions
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = (this.size.height - this.margin.top - this.margin.bottom) / 2;
    
        // Remove existing SVG (cleanup step)
        d3.select(this.el).selectAll("svg").remove();
    
        // Define ranges for both scatterplot and density plot
        this.scaleX.range([0, this.width]);
        this.scaleY.range([this.height, 0]);
    
        // Set domains dynamically based on selected attributes
        const xExtent = d3.extent(visData, (d) => d[this.xAttr]);
        const yExtent = d3.extent(visData, (d) => d[this.yAttr]);
        this.scaleX.domain(xExtent);
        this.scaleY.domain(yExtent);
    
        console.log('X Extent:', xExtent, 'Y Extent:', yExtent); // Log axis extents
    
        // Initialize SVG
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", this.size.width)
            .attr("height", this.size.height + 100) // Extra space for density plot
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
            .attr("clip-path", "url(#clip-density)"); // Apply the clipPath

            
    
        // Add axes for density plot
        densityContainer.append('g') // X-Axis
            .attr('class', 'densityplot-x-axis')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.scaleX));
    
        densityContainer.append('g') // Y-Axis
            .attr('class', 'densityplot-y-axis')
            .call(d3.axisLeft(this.scaleY));
    
        // Add scatterplot axes
        this.scatterplotG.append('g') // X-Axis
            .attr('class', 'scatterplot-x-axis')
            .attr('transform', `translate(0, ${this.height})`)
            .call(d3.axisBottom(this.scaleX));
    
        this.scatterplotG.append('g') // Y-Axis
            .attr('class', 'scatterplot-y-axis')
            .call(d3.axisLeft(this.scaleY));


        // Add labels for scatterplot axes
        this.scatterplotG.append("text")
            .attr("class", "scatter-x-axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40) // Position below the x-axis
            .style("text-anchor", "middle")
            .text(this.xAttr); // Initial label for x-axis

        this.scatterplotG.append("text")
            .attr("class", "scatter-y-axis-label")
            .attr("x", -this.height / 2)
            .attr("y", -40) // Position to the left of the y-axis
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text(this.yAttr); // Initial label for y-axis

        // Add labels for density plot axes
        densityContainer.append("text")
            .attr("class", "density-x-axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40) // Position below the x-axis
            .style("text-anchor", "middle")
            .text(this.xAttr); // Initial label for x-axis

        densityContainer.append("text")
            .attr("class", "density-y-axis-label")
            .attr("x", -this.height / 2)
            .attr("y", -40) // Position to the left of the y-axis
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text(this.yAttr); // Initial label for y-
            

        this.updateLabels();

        // Render both plots
        this.renderScatterPlot(visData);
        this.renderDensityPlot(visData);
    
        setTimeout(() => {
            this.redrawAxes();
        }, 400);
    };
    
    updateLabels = function () {
        if (this.scatterplotG) {
            // Update scatterplot labels
            const scatterXLabel = this.scatterplotG.select(".scatter-x-axis-label");
            if (!scatterXLabel.empty()) scatterXLabel.text(this.xAttr);
    
            const scatterYLabel = this.scatterplotG.select(".scatter-y-axis-label");
            if (!scatterYLabel.empty()) scatterYLabel.text(this.yAttr);
        } else {
            console.warn("scatterplotG is not initialized.");
        }
    
        if (this.matSvg) {
            // Update density plot labels
            const densityXLabel = this.matSvg.select(".density-x-axis-label");
            if (!densityXLabel.empty()) densityXLabel.text(this.xAttr);
    
            const densityYLabel = this.matSvg.select(".density-y-axis-label");
            if (!densityYLabel.empty()) densityYLabel.text(this.yAttr);
        } else {
            console.warn("matSvg is not initialized.");
        }
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
        this.addScatterplotBrush(visData);

    };
    

    addScatterplotBrush = function (visData) {
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start", ({ selection }) => {
                // Clear any previous selections and reset density plot
                this.scatterplotG.selectAll(".brush").call(brush.move, null);
                this.selectedData = [];
                this.scatterplotG.selectAll("circle").attr("opacity", 1);
                this.renderDensityPlot([]);
            })
            .on("brush", ({ selection }) => {
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;
    
                    this.selectedData = visData.filter((d) => {
                        const cx = this.scaleX(d[this.xAttr]);
                        const cy = this.scaleY(d[this.yAttr]);
                        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                    });
    
                    this.scatterplotG.selectAll("circle")
                        .attr("opacity", (d) =>
                            this.selectedData.includes(d) ? 1 : 0.2
                        );
    
                    this.renderDensityPlot(this.selectedData);
                }
            })
            .on("end", ({ selection }) => {
                if (!selection) {
                    this.selectedData = [];
                    this.scatterplotG.selectAll("circle").attr("opacity", 1);
                    this.renderDensityPlot([]);
                }
            });
    
        this.scatterplotG.append("g")
            .attr("class", "brush")
            .call(brush);
    };
    
    

    renderDensityPlot = function (visData) {
        if (!visData || visData.length === 0) {
            console.warn('No data for density plot');
            return;
        }
    
        const densityGenerator = d3.contourDensity()
            .x((d) => this.scaleX(d[this.xAttr]))
            .y((d) => this.scaleY(d[this.yAttr]))
            .size([this.width, this.height])
            .bandwidth(20);
    
        const contours = densityGenerator(visData);
    
        const colorScale = d3.scaleSequential(d3.interpolateTurbo)
            .domain([0, d3.max(contours, (d) => d.value)]);
    
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
