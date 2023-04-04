import dayjs from "dayjs";
import { useEffect, useState } from "react";
import useDatabase from "./Persistence/useDatabase";
import { useNavigate, createMemoryRouter, RouterProvider, Link } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import "./App.css";

import * as paths from "./paths";
import Dashboard from "./Dashboard/Dashboard";
import Planner from "./Planner/Planner";
import { dateToDayId } from "./dateutils";
import { ListRubric } from "./List";

const Root = function() {
	const today = dayjs();
	const navigate = useNavigate();
	// TODO: navigate to dashboard only if the day has been planned
	const db = useDatabase();

	useEffect(() => {
		db.items.loadAll();
		db.lists.loadAll();
	}, [])

	useEffect(() => {
		// depending on the existence of a user, route accordingly
		db.user.get("email").then(u => {
			if (!u) {
				return;
			}
			else {
				const todayId = dateToDayId(today);
				db.lists.has(todayId).then((res) => {
					if (res)
						db.lists.get(todayId).then((val) =>
							(!(val as ListRubric).planned) ? navigate(paths.PLANNER_PATH) : navigate(paths.PLANNER_PATH));
					else
						db.lists.create(today).then((res) =>
							(res) ? navigate(paths.PLANNER_PATH) : null);
				});
			}
		});
	}, []);

	return <div style={{ display: "flex", flexDirection: "column" }}>
		<button onClick={() => navigate(paths.DASHBOARD_PATH)}>Dashboard</button>
		<button onClick={() => navigate(paths.PLANNER_PATH)}>Planner</button>
	</div>
}

const App = function() {
	// overall App state should be stored in this functional component
	const [date, setDate] = useState<dayjs.Dayjs>(dayjs().startOf("day"));

	const router = createMemoryRouter([
		{
			path: paths.ROOT_PATH,
			element: <Root />
		},
		{
			path: paths.DASHBOARD_PATH,
			element: <Dashboard date={date} setDate={setDate} />
		},
		{
			path: paths.PLANNER_PATH,
			element: <Planner date={date} setDate={setDate} />
		}
	]);

	return (
		<MantineProvider
			theme={{
				colorScheme: "light",
				colors: {
					'stackblue': ["#FFFFFF", "#DADAE7", "#6179D4", "#2A29D4", "#13146A", "#000000"]
				}
			}}
			withGlobalStyles
		>
			<RouterProvider router={router} />
		</MantineProvider>
	);
}

export default App;
