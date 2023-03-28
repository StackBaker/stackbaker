import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useNavigate, createMemoryRouter, RouterProvider } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import "./App.css";

import * as paths from "./paths";
import Dashboard from "./Dashboard";

const Root = function() {
	const navigate = useNavigate();
	// TODO: retrieve user and planning info from backend and navigate to dashboard
	// only if the day has been planned

	return (
		<div>
			<button onClick={() => navigate(paths.DASHBOARD_PATH)}>hi</button>
		</div>
	);
}


const App = function() {
	// overall App state should be stored in this functional component
	const router = createMemoryRouter([
		{
			path: paths.ROOT_PATH,
			element: <Root />
		},
		{
			path: paths.DASHBOARD_PATH,
			element: <Dashboard />
		}
	]);

	return (
		<MantineProvider theme={{ colorScheme: "light" }} withGlobalStyles>
			<RouterProvider router={router} />
		</MantineProvider>
	);
}

export default App;
