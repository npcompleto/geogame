import React, { memo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import { scaleQuantize } from "d3-scale";

// We import the local GeoJSON
import italyGeo from "../italy-regions.json";

const Map = ({ onRegionClick, lastResult }) => {
    // lastResult: { correct: bool, regionName: string } or similar if we want to show feedback on map

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
                            const regName = geo.properties.reg_name || geo.properties.name; // OpenPolis uses reg_name usually, check json
                            // To be safe, we can inspect, but standard is reg_name. Simplemaps might use 'name'.

                            // Let's assume standard GeoJSON properties. OpenPolis usually has 'reg_name'.
                            // If it fails, map will be blank or non-interactive.
                            // We'll try to find the name property.

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onClick={() => {
                                        // Extract name. OpenPolis: reg_name.
                                        // Try both.
                                        const name = geo.properties.users_reg_name || geo.properties.reg_name || geo.properties.check_name || geo.properties.name;
                                        onRegionClick(name);
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
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
};

export default memo(Map);
