import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useNavigate } from "react-router-dom";
import "./Root.css";

import * as paths from "./paths";

function Root() {
	const navigate = useNavigate();

	// TODO: retrieve user and planning info from backend and navigate to dashboard
	// only if the day has been planned
	
    return (
        <div>
            <h1>Welcome to StackBaker!</h1>
			<button onClick={() => navigate(paths.DASHBOARD_PATH)}>Click</button>
        </div>
    );
}

export default Root;
