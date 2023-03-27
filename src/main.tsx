import React from "react";
import ReactDOM from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import Root from "./Root";
import Dashboard from "./Dashboard";
import * as paths from "./paths";
import "./styles.css";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<MantineProvider theme={{ colorScheme: "light" }} withGlobalStyles>
			<RouterProvider router={router} />
		</MantineProvider>
	</React.StrictMode>
);
