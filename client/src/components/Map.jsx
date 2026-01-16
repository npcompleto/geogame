import React, { memo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoCentroid } from "d3-geo";

// We import the local GeoJSON
import italyGeo from "../italy-regions.json";

const Map = ({ onRegionClick, showLabels }) => {
    return (
        <div className="map-wrapper" style={{ width: "100%", height: "60vh", position: "relative" }}>
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 2200,
                    center: [12.5, 42] // Center roughly on Italy
                }}
                style={{ width: "100%", height: "100%" }}
            >
                <Geographies geography={italyGeo}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const regName = geo.properties.users_reg_name || geo.properties.reg_name || geo.properties.check_name || geo.properties.name;
                            const centroid = geoCentroid(geo);

                            return (
                                <React.Fragment key={geo.rsmKey}>
                                    <Geography
                                        geography={geo}
                                        onClick={() => {
                                            onRegionClick(regName);
                                        }}
                                        className="region-path"
                                        style={{
                                            default: {
                                                outline: "none"
                                            },
                                            hover: {
                                                fill: "#475569",
                                                outline: "none"
                                            },
                                            pressed: {
                                                fill: "#2563eb",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                    {showLabels && (
                                        <Marker coordinates={centroid}>
                                            <text
                                                textAnchor="middle"
                                                y={5}
                                                style={{
                                                    fontFamily: "system-ui",
                                                    fill: "#ffffff", // Dark text normally, but map color?
                                                    // Map default fill is usually strict unless CSS overrides. 
                                                    // In index.css probably .region-path has fill.
                                                    // Let's use white with shadow or similar.
                                                    fontSize: "10px",
                                                    pointerEvents: "none",
                                                    textShadow: "1px 1px 2px black"
                                                }}
                                            >
                                                {regName}
                                            </text>
                                        </Marker>
                                    )}
                                </React.Fragment>
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
};

export default memo(Map);
