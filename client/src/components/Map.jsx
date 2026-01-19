import React, { memo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import "./Map.css";

// We import the local GeoJSON
import italyGeo from "../italy-regions.json";

const Map = ({ onRegionClick, showLabels }) => {
    return (
        <div className="map-wrapper">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 2500,
                    center: [12.5, 42] // Center roughly on Italy
                }}
                className="map-composable"
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
                                        className="region-path map-geography"
                                    />
                                    {showLabels && (
                                        <Marker coordinates={centroid}>
                                            <text
                                                textAnchor="middle"
                                                y={5}
                                                className="map-label-text"
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

