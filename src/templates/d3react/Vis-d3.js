import * as d3 from 'd3';

class VisD3 {
    margin = { top: 100, right: 5, bottom: 5, left: 100 };
    size;
    height;
    width;
    matSvg;
    cellSize= 34;
    scale1 = d3.scaleLinear(); // Initialized without range
    scale2 = d3.scaleLinear(); // Initialized without range
    radius = this.cellSize / 2;
    colorScheme = d3.schemeYlGnBu[9];

    cellSizeScale = d3.scaleLinear()
         .range([2, this.radius-1])
     ;

    constructor(el) {
        this.el = el;
    }

    create = function (config) {
        this.size = { width: config.size.width, height: config.size.height };

        // Get the effective size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // Set the range for the scales now that width and height are calculated
        this.scale1.range([0, this.width]);
        this.scale2.range([this.height, 0]); // SVG y-axis is reversed


        // Initialize the SVG container
        this.matSvg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class", "matSvgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        this.matSvg
            .append('g')
            .attr('transform', `translate(0, ${this.height - this.margin.bottom})`)
            .call(d3.axisBottom(this.scale1));

        this.matSvg
            .append('g')
            .attr('transform', `translate(${this.margin.left}, 0)`)
            .call(d3.axisLeft(this.scale2));

    };

    updateFunction1 = function (selection) {
        selection.select("circle")
            .attr("cx", (d) => this.scale1(d.x))
            .attr("cy", (d) => this.scale2(d.y))
            .attr("fill", "red"); // Default color
    };
    

    renderVis = function (visData, controllerMethods) {
         // Preprocess data to map fields to x and y

        const minVal_t = d3.min(visData, (d) => d.Temperature); // Smallest Temperature value
        const maxVal_t = d3.max(visData, (d) => d.Temperature); // Largest Temperature value
        this.scale1.domain([minVal_t, maxVal_t])

        const minVal_b = d3.min(visData, (d) => d.RentedBikeCount); // Smallest RentedBikeCount value
        const maxVal_b = d3.max(visData, (d) => d.RentedBikeCount); // Largest RentedBikeCount value
        this.scale2.domain([minVal_b, maxVal_b])

        console.log("Scale1 (Temperature) Domain:", this.scale1.domain(), "Range:", this.scale1.range());
        console.log("Scale2 (RentedBikeCount) Domain:", this.scale2.domain(), "Range:", this.scale2.range());


        const processedData = visData.map((d) => ({
            ...d,
            x: d.Temperature,
            y: d.RentedBikeCount,
        }));

        this.matSvg.selectAll(".itemG")
            .data(processedData, (itemData) => itemData.index) // Bind data to elements
            .join(
                (enter) => {
                    const itemG = enter
                        .append("g")
                        .attr("class", "itemG")
                        .on("click", (event, itemData) => {
                            controllerMethods.handleOnEvent1(itemData); // Example event 1
                        })
                        .on("mouseover", (event, itemData) => {
                            controllerMethods.handleOnEvent2(itemData); // Example event 2
                        });

                    // Add a circle for each data point
                    itemG.append("circle")
                        .attr("cx", (d) => this.scale1(d.Temperature))
                        .attr("cy", (d) => this.scale2(d.RentedBikeCount))
                        .attr("r", 2)
                        .attr("fill", (d) =>  "red");

                    // Render dynamic properties
                    this.updateFunction1(itemG);
                },
                (update) => {
                    // Handle updates
                    this.updateFunction1(update);
                },
                (exit) => {
                    // Remove elements no longer in data
                    exit.remove();
                }
            );
            this.addScatterplotBrush(controllerMethods); // Add brush to scatterplot
    };

    addScatterplotBrush = function (controllerMethods) {
        console.log("Brush extent dimensions:", this.width, this.height);

        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("brush", ({ selection }) => {
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;
    
                    // Adjust opacity based on selection
                    

                    this.matSvg.selectAll(".itemG circle")
                        .attr("opacity", (d) => {
                            const cx = this.scale1(d.x);
                            const cy = this.scale2(d.y);
                            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1 ? 1 : 0.2;
                        });
                    // Filter selected data
                    const selectedData = this.matSvg.selectAll(".itemG circle")
                        .filter((d) => {
                            const cx = this.scale1(d.x);
                            const cy = this.scale2(d.y);
                            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                        })
                        .data();
    
                    //controllerMethods.handleOnEvent1(selectedData);
                }
            })
            .on("end", ({ selection }) => {
                if (!selection) {
                    // Clear the brush only if there is no selection
                    this.matSvg.select(".brush").call(brush.move, null);
                }
            });
            
    
        this.matSvg.append("g")
            .attr("class", "brush")
            .call(brush);
    };
    

    clear = function () {
        // Clear all SVG content
        d3.select(this.el).selectAll("*").remove();
    };

    renderHeatmap = function (data, controllerMethods) {
        const gridRows = 24; // Define the number of rows (e.g., hours of the day)
        const gridCols = data.length / gridRows; // Define columns based on data size
        const cellWidth = this.width / gridCols;
        const cellHeight = this.height / gridRows;
    
        // Define a color scale
        const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
            .domain(d3.extent(data, (d) => d.RentedBikeCount)); // Map `RentedBikeCount` values
    
        // Map data to grid structure
        const gridData = data.map((d, i) => ({
            row: Math.floor(i / gridCols),
            col: i % gridCols,
            value: d.RentedBikeCount,
        }));
    
        // Bind and render grid cells
        this.matSvg.selectAll(".heatmap-cell")
            .data(gridData, (d) => `${d.row}-${d.col}`)
            .join(
                (enter) =>
                    enter
                        .append("rect")
                        .attr("class", "heatmap-cell")
                        .attr("x", (d) => d.col * cellWidth)
                        .attr("y", (d) => d.row * cellHeight)
                        .attr("width", cellWidth)
                        .attr("height", cellHeight)
                        .attr("fill", (d) => colorScale(d.value)),
                (update) =>
                    update.attr("fill", (d) => colorScale(d.value)),
                (exit) => exit.remove()
            );
    
        // Add brushing
        this.addBrush(controllerMethods);
    };
    
    addBrush = function (controllerMethods) {
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("brush", ({ selection }) => {
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;
    
                    // Filter selected cells
                    const selectedData = this.matSvg
                        .selectAll(".heatmap-cell")
                        .filter((d) => {
                            const x = d.col * (this.width / this.gridCols);
                            const y = d.row * (this.height / this.gridRows);
                            return x0 <= x && x <= x1 && y0 <= y && y <= y1;
                        })
                        .data();
    
                    controllerMethods.handleOnEvent1(selectedData);
                }
            })
            .on("end", ({ selection }) => {
                if (!selection) {
                    this.matSvg.select(".brush").call(brush.move, null);
                }
            });
    
        // Append brush to the SVG
        this.matSvg.append("g")
            .attr("class", "brush")
            .call(brush);
    };
    
    
}

export default VisD3;
