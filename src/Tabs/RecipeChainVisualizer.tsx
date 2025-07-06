import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
} from "react";
import * as d3 from "d3";
import type { Recipe, Item, Building, Unit } from "../types";
import { normalizeToSIUnit } from "../utils";
import "./RecipeChainVisualizer.css";

interface RecipeNode extends d3.SimulationNodeDatum {
    id: string;
    recipe: Recipe;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface RecipeLink extends d3.SimulationLinkDatum<RecipeNode> {
    source: RecipeNode | string;
    target: RecipeNode | string;
    type: "recipe-connection" | "item-flow";
    itemId?: number;
    amount?: number;
}

interface RecipeChainVisualizerProps {
    recipes: Recipe[];
    items: Item[];
    buildings: Building[];
    units: Unit[];
}

const RecipeChainVisualizer: React.FC<RecipeChainVisualizerProps> = ({
    recipes,
    items,
    buildings,
    units,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedNodeIdRef = useRef<string | null>(null);
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(
        null
    );
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [hoverInfo, setHoverInfo] = useState<{
        visible: boolean;
        content: Recipe | Partial<Recipe> | null;
    }>({ visible: false, content: null });
    const [selectedInfo, setSelectedInfo] = useState<{
        visible: boolean;
        content: Recipe | Partial<Recipe> | null;
    }>({ visible: false, content: null });

    // Transform state for pan and zoom (removed unused variable)
    // const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

    // Helper functions
    const getItemName = useCallback(
        (itemId: number): string => {
            return (
                items.find((item) => item.ItemID === itemId)?.ItemName ||
                `Item ${itemId}`
            );
        },
        [items]
    );

    const getBuildingName = useCallback(
        (buildingId: number): string => {
            return (
                buildings.find((building) => building.BuildingID === buildingId)
                    ?.BuildingName || `Building ${buildingId}`
            );
        },
        [buildings]
    );

    const getUnitName = useCallback(
        (itemId: number): string => {
            const item = items.find((i) => i.ItemID === itemId);
            if (!item) return "";
            const unit = units.find((u) => u.UnitID === item.UnitID);
            return unit?.UnitName || "";
        },
        [items, units]
    );

    const formatTime = useCallback((seconds: number): string => {
        if (seconds === 0) return "0s";

        const units = [
            { name: "d", value: 86400 },
            { name: "h", value: 3600 },
            { name: "m", value: 60 },
            { name: "s", value: 1 },
        ];

        for (const unit of units) {
            if (seconds >= unit.value) {
                const value = Math.floor(seconds / unit.value);
                const remainder = seconds % unit.value;
                if (remainder === 0) {
                    return `${value}${unit.name}`;
                } else {
                    const nextUnit = units[units.indexOf(unit) + 1];
                    if (nextUnit && remainder >= nextUnit.value) {
                        const nextValue = Math.floor(
                            remainder / nextUnit.value
                        );
                        return `${value}${unit.name} ${nextValue}${nextUnit.name}`;
                    }
                    return `${value}${unit.name}`;
                }
            }
        }
        return `${seconds}s`;
    }, []);

    // Memoized graph data that only updates when recipes or selection actually changes
    const graphData = useMemo(() => {
        if (!selectedRecipeId) {
            return { nodes: [], links: [] };
        }

        // Find recipes in the input chain (dependencies) of the selected recipe
        const connectedRecipeIds = new Set<number>();
        const toProcess = [selectedRecipeId];

        while (toProcess.length > 0) {
            const currentRecipeId = toProcess.pop()!;
            if (connectedRecipeIds.has(currentRecipeId)) continue;

            connectedRecipeIds.add(currentRecipeId);

            const currentRecipe = recipes.find(
                (r) => r.RecipeID === currentRecipeId
            );
            if (!currentRecipe) continue;

            // Only find recipes that produce our inputs (dependency chain)
            currentRecipe.Inputs.forEach((input) => {
                recipes.forEach((sourceRecipe) => {
                    if (!connectedRecipeIds.has(sourceRecipe.RecipeID)) {
                        const hasMatchingOutput = sourceRecipe.Outputs.some(
                            (output) => output.ItemID === input.ItemID
                        );
                        if (hasMatchingOutput) {
                            toProcess.push(sourceRecipe.RecipeID);
                        }
                    }
                });
            });
        }

        const connectedRecipes = recipes.filter((r) =>
            connectedRecipeIds.has(r.RecipeID)
        );

        const nodes: RecipeNode[] = connectedRecipes.map((recipe) => ({
            id: recipe.RecipeID.toString(),
            recipe,
            x: Math.random() * 800 + 100,
            y: Math.random() * 400 + 100,
        }));

        const links: RecipeLink[] = [];

        // Create recipe connections based on shared items
        connectedRecipes.forEach((sourceRecipe) => {
            sourceRecipe.Outputs.forEach((output) => {
                connectedRecipes.forEach((targetRecipe) => {
                    if (sourceRecipe.RecipeID !== targetRecipe.RecipeID) {
                        const hasMatchingInput = targetRecipe.Inputs.some(
                            (input) => input.ItemID === output.ItemID
                        );
                        if (hasMatchingInput) {
                            links.push({
                                source: sourceRecipe.RecipeID.toString(),
                                target: targetRecipe.RecipeID.toString(),
                                type: "item-flow",
                                itemId: output.ItemID,
                                amount: output.Amount,
                            });
                        }
                    }
                });
            });
        });

        return { nodes, links };
    }, [recipes, selectedRecipeId]);

    // Initialize and update the visualization
    useEffect(() => {
        if (!svgRef.current || !containerRef.current || !selectedRecipeId)
            return;

        const svg = d3.select(svgRef.current);
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Clear previous content
        svg.selectAll("*").remove();

        // Create graph data
        const { nodes, links } = graphData;

        if (nodes.length === 0) return;

        // Create main group for zoom/pan
        const g = svg.append("g");

        // Define arrow marker
        svg.append("defs")
            .append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "rgba(255, 255, 255, 0.4)");

        // Create force simulation
        const simulation = d3
            .forceSimulation<RecipeNode>(nodes)
            .force(
                "link",
                d3
                    .forceLink<RecipeNode, RecipeLink>(links)
                    .id((d) => d.id)
                    .distance(300)
                    .strength(0.5)
            )
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(80));

        // Create links
        const link = g
            .append("g")
            .selectAll("path")
            .data(links)
            .enter()
            .append("path")
            .attr("class", (d) =>
                d.type === "item-flow" ? "item-flow-line" : "connection-line"
            )
            .on("mouseover", function (_event, d) {
                if (d.type === "item-flow" && d.itemId) {
                    const itemName = getItemName(d.itemId);
                    const unitName = getUnitName(d.itemId);
                    setHoverInfo({
                        visible: true,
                        content: {
                            RecipeName: `${itemName} Flow`,
                            RecipeDescription: `${d.amount} ${unitName}`,
                        } as Partial<Recipe>,
                    });
                }
            })
            .on("mouseout", () => {
                setHoverInfo({ visible: false, content: null });
            })
            .on("click", function (event, d) {
                event.stopPropagation();
                if (d.type === "item-flow" && d.itemId) {
                    const itemName = getItemName(d.itemId);
                    const unitName = getUnitName(d.itemId);
                    setSelectedInfo({
                        visible: true,
                        content: {
                            RecipeName: `${itemName} Flow`,
                            RecipeDescription: `${d.amount} ${unitName}`,
                        } as Partial<Recipe>,
                    });
                    selectedNodeIdRef.current = null;
                    setSelectedNodeId(null); // Clear node selection
                }
            });

        // Create link labels for item names
        const linkLabels = g
            .append("g")
            .selectAll("text")
            .data(links.filter((d) => d.type === "item-flow" && d.itemId))
            .enter()
            .append("text")
            .attr("class", "link-label")
            .attr("text-anchor", "middle")
            .attr("dy", "-5")
            .text((d) => (d.itemId ? getItemName(d.itemId) : ""))
            .style("font-size", "10px")
            .style("fill", "rgba(255, 255, 255, 0.8)")
            .style("text-shadow", "1px 1px 2px rgba(0, 0, 0, 0.8)")
            .style("pointer-events", "none");

        // Create node groups
        const nodeGroup = g
            .append("g")
            .selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node-group")
            .call(
                d3
                    .drag<SVGGElement, RecipeNode>()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            );

        // Add rectangles for nodes
        nodeGroup
            .append("rect")
            .attr("class", "recipe-node")
            .attr("width", 160)
            .attr("height", 100)
            .attr("x", -80)
            .attr("y", -50)
            .attr("rx", 8)
            .on("mouseover", function (_event, d) {
                if (selectedNodeIdRef.current !== d.id) {
                    setHoverInfo({
                        visible: true,
                        content: d.recipe,
                    });
                }
            })
            .on("mouseout", () => {
                setHoverInfo({ visible: false, content: null });
            })
            .on("click", function (event, d) {
                event.stopPropagation();
                selectedNodeIdRef.current = d.id;
                setSelectedNodeId(d.id);
                setSelectedInfo({
                    visible: true,
                    content: d.recipe,
                });
                setHoverInfo({ visible: false, content: null });
            });

        // Add recipe name
        nodeGroup
            .append("text")
            .attr("class", "recipe-node-text title")
            .attr("y", -25)
            .text((d) =>
                d.recipe.RecipeName.length > 18
                    ? d.recipe.RecipeName.substring(0, 15) + "..."
                    : d.recipe.RecipeName
            );

        // Add building name
        nodeGroup
            .append("text")
            .attr("class", "recipe-node-text subtitle")
            .attr("y", -10)
            .text((d) => getBuildingName(d.recipe.BuildingID));

        // Add stats (power, water, time)
        nodeGroup
            .append("text")
            .attr("class", "recipe-node-text stats")
            .attr("y", 5)
            .text(
                (d) =>
                    `⚡${normalizeToSIUnit(
                        d.recipe.Power,
                        "Wh"
                    )} 💧${normalizeToSIUnit(d.recipe.Water, "L")}`
            );

        nodeGroup
            .append("text")
            .attr("class", "recipe-node-text stats")
            .attr("y", 18)
            .text((d) => `⏱️${formatTime(d.recipe.Time)}`);

        // Drag functions
        function dragstarted(
            event: d3.D3DragEvent<SVGGElement, RecipeNode, unknown>,
            d: RecipeNode
        ) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(
            event: d3.D3DragEvent<SVGGElement, RecipeNode, unknown>,
            d: RecipeNode
        ) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(
            event: d3.D3DragEvent<SVGGElement, RecipeNode, unknown>,
            d: RecipeNode
        ) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Update positions on simulation tick
        simulation.on("tick", () => {
            link.attr("d", (d) => {
                const source = d.source as RecipeNode;
                const target = d.target as RecipeNode;
                const dx = target.x! - source.x!;
                const dy = target.y! - source.y!;
                const dr = Math.sqrt(dx * dx + dy * dy);
                return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
            });

            // Position link labels at the midpoint of each link
            linkLabels
                .attr("x", (d) => {
                    const source = d.source as RecipeNode;
                    const target = d.target as RecipeNode;
                    return (source.x! + target.x!) / 2;
                })
                .attr("y", (d) => {
                    const source = d.source as RecipeNode;
                    const target = d.target as RecipeNode;
                    return (source.y! + target.y!) / 2;
                });

            nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
        });

        // Add zoom behavior
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                const { transform } = event;
                g.attr("transform", transform);
            });

        svg.call(zoom);

        // Prevent zoom on double-click to avoid conflicts with node clicks
        svg.on("dblclick.zoom", null);

        // Click on background to clear selection
        svg.on("click", function (event) {
            // Only clear if clicking on background (not propagated from nodes/links)
            if (event.target === svg.node()) {
                selectedNodeIdRef.current = null;
                setSelectedNodeId(null);
                setSelectedInfo({ visible: false, content: null });
            }
        });

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [
        selectedRecipeId,
        graphData,
        getItemName,
        getBuildingName,
        getUnitName,
        formatTime,
    ]);

    // Handle node selection styling without re-rendering the graph
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);

        // Update all node rectangles
        svg.selectAll(".recipe-node").classed("selected", (d: unknown) => {
            const nodeData = d as RecipeNode;
            return nodeData.id === selectedNodeId;
        });

        // Sync the ref
        selectedNodeIdRef.current = selectedNodeId;
    }, [selectedNodeId]);

    // Control functions
    const handleZoomIn = () => {
        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            const zoom = d3.zoom<SVGSVGElement, unknown>();
            svg.transition().duration(300).call(zoom.scaleBy, 1.5);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            const zoom = d3.zoom<SVGSVGElement, unknown>();
            svg.transition()
                .duration(300)
                .call(zoom.scaleBy, 1 / 1.5);
        }
    };

    const handleResetView = () => {
        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            const zoom = d3.zoom<SVGSVGElement, unknown>();
            svg.transition()
                .duration(500)
                .call(zoom.transform, d3.zoomIdentity);
        }
    };

    const handleFitToScreen = () => {
        if (svgRef.current && containerRef.current) {
            const svg = d3.select(svgRef.current);
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();

            // Calculate bounding box of all nodes
            const nodes = svg.selectAll(".node-group").data() as RecipeNode[];
            if (nodes.length === 0) return;

            const bounds = {
                minX: Math.min(...nodes.map((d) => (d.x || 0) - 80)),
                maxX: Math.max(...nodes.map((d) => (d.x || 0) + 80)),
                minY: Math.min(...nodes.map((d) => (d.y || 0) - 50)),
                maxY: Math.max(...nodes.map((d) => (d.y || 0) + 50)),
            };

            const width = bounds.maxX - bounds.minX;
            const height = bounds.maxY - bounds.minY;
            const centerX = (bounds.minX + bounds.maxX) / 2;
            const centerY = (bounds.minY + bounds.maxY) / 2;

            const scale = Math.min(
                (rect.width - 100) / width,
                (rect.height - 100) / height,
                2
            );

            const transform = d3.zoomIdentity
                .translate(
                    rect.width / 2 - centerX * scale,
                    rect.height / 2 - centerY * scale
                )
                .scale(scale);

            const zoom = d3.zoom<SVGSVGElement, unknown>();
            svg.transition().duration(750).call(zoom.transform, transform);
        }
    };

    if (recipes.length === 0) {
        return (
            <div className="recipe-chain-visualizer">
                <div className="empty-state">
                    <div className="empty-state-icon">🧪</div>
                    <div className="empty-state-title">
                        No Recipes Available
                    </div>
                    <div className="empty-state-subtitle">
                        Add some recipes to visualize their connections
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedRecipeId) {
        return (
            <div className="recipe-chain-visualizer">
                {/* Recipe Selector */}
                <div className="recipe-controls">
                    <select
                        value={selectedRecipeId || ""}
                        onChange={(e) =>
                            setSelectedRecipeId(Number(e.target.value) || null)
                        }
                        style={{
                            background: "rgba(40, 40, 40, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "white",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            minWidth: "200px",
                        }}
                    >
                        <option value="">Select a recipe to visualize</option>
                        {recipes
                            .sort((a, b) =>
                                a.RecipeName.localeCompare(b.RecipeName)
                            )
                            .map((recipe) => (
                                <option
                                    key={recipe.RecipeID}
                                    value={recipe.RecipeID}
                                >
                                    {recipe.RecipeName}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="empty-state">
                    <div className="empty-state-icon">🔗</div>
                    <div className="empty-state-title">
                        Select a Recipe to Visualize
                    </div>
                    <div className="empty-state-subtitle">
                        Choose a recipe to see its input dependency chain
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="recipe-chain-visualizer" ref={containerRef}>
                {/* Controls */}
                <div className="recipe-controls">
                    <select
                        value={selectedRecipeId || ""}
                        onChange={(e) => {
                            setSelectedRecipeId(Number(e.target.value) || null);
                            selectedNodeIdRef.current = null;
                            setSelectedNodeId(null);
                            setSelectedInfo({ visible: false, content: null });
                            setHoverInfo({ visible: false, content: null });
                        }}
                        style={{
                            background: "rgba(40, 40, 40, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "white",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            minWidth: "200px",
                            marginRight: "8px",
                        }}
                    >
                        <option value="">Select a recipe to visualize</option>
                        {recipes
                            .sort((a, b) =>
                                a.RecipeName.localeCompare(b.RecipeName)
                            )
                            .map((recipe) => (
                                <option
                                    key={recipe.RecipeID}
                                    value={recipe.RecipeID}
                                >
                                    {recipe.RecipeName}
                                </option>
                            ))}
                    </select>
                    <button onClick={handleResetView} title="Reset View">
                        🎯 Reset
                    </button>
                    <button onClick={handleFitToScreen} title="Fit to Screen">
                        📐 Fit All
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="zoom-controls">
                    <button onClick={handleZoomIn} title="Zoom In">
                        +
                    </button>
                    <button onClick={handleZoomOut} title="Zoom Out">
                        −
                    </button>
                </div>

                {/* Main SVG */}
                <svg ref={svgRef} className="recipe-chain-visualizer__svg" />
            </div>

            {/* Recipe Information Panel - Outside the graph container */}
            {(selectedInfo.visible || hoverInfo.visible) &&
                (selectedInfo.content || hoverInfo.content) && (
                    <div className="recipe-info-panel-external">
                        {/* Show selected content if available, otherwise hover content */}
                        {(() => {
                            const displayContent = selectedInfo.visible
                                ? selectedInfo.content
                                : hoverInfo.content;
                            const isSelected = selectedInfo.visible;

                            return (
                                <>
                                    <h4
                                        style={{
                                            color: isSelected
                                                ? "rgba(76, 205, 196, 1)"
                                                : "rgba(255, 183, 77, 1)",
                                        }}
                                    >
                                        {isSelected ? "📌 " : ""}
                                        {displayContent?.RecipeName}
                                        {isSelected ? " (Selected)" : ""}
                                    </h4>
                                    {displayContent?.RecipeDescription && (
                                        <div className="description">
                                            {displayContent.RecipeDescription}
                                        </div>
                                    )}
                                    {displayContent?.BuildingID && (
                                        <div className="stats">
                                            <div className="stat">
                                                <span className="stat-label">
                                                    Building:
                                                </span>
                                                <span className="stat-value">
                                                    {getBuildingName(
                                                        displayContent.BuildingID
                                                    )}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">
                                                    Power:
                                                </span>
                                                <span className="stat-value">
                                                    {normalizeToSIUnit(
                                                        displayContent.Power ||
                                                            0,
                                                        "Wh"
                                                    )}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">
                                                    Water:
                                                </span>
                                                <span className="stat-value">
                                                    {normalizeToSIUnit(
                                                        displayContent.Water ||
                                                            0,
                                                        "L"
                                                    )}
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">
                                                    Time:
                                                </span>
                                                <span className="stat-value">
                                                    {formatTime(
                                                        displayContent.Time || 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {displayContent?.Inputs &&
                                        displayContent.Inputs.length > 0 && (
                                            <div className="io-section">
                                                <div className="io-title inputs">
                                                    Inputs
                                                </div>
                                                <div className="io-list">
                                                    {displayContent.Inputs.map(
                                                        (
                                                            input: {
                                                                ItemID: number;
                                                                Amount: number;
                                                            },
                                                            idx: number
                                                        ) => (
                                                            <div key={idx}>
                                                                {getItemName(
                                                                    input.ItemID
                                                                )}
                                                                : {input.Amount}{" "}
                                                                {getUnitName(
                                                                    input.ItemID
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    {displayContent?.Outputs &&
                                        displayContent.Outputs.length > 0 && (
                                            <div className="io-section">
                                                <div className="io-title outputs">
                                                    Outputs
                                                </div>
                                                <div className="io-list">
                                                    {displayContent.Outputs.map(
                                                        (
                                                            output: {
                                                                ItemID: number;
                                                                Amount: number;
                                                            },
                                                            idx: number
                                                        ) => (
                                                            <div key={idx}>
                                                                {getItemName(
                                                                    output.ItemID
                                                                )}
                                                                :{" "}
                                                                {output.Amount}{" "}
                                                                {getUnitName(
                                                                    output.ItemID
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </>
                            );
                        })()}
                    </div>
                )}
        </>
    );
};

export default RecipeChainVisualizer;
