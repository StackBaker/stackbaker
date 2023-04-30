import dayjs from "dayjs";
import { useEffect, useState } from "react";
import useDatabase from "./Persistence/useDatabase";
import { useNavigate, createMemoryRouter, RouterProvider } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import "./App.css";
import "./styles.css";

import * as paths from "./paths";
import Dashboard from "./Dashboard/Dashboard";
import Planner from "./Planner/Planner";
import { dateToDayId, getToday } from "./dateutils";
import { ListRubric } from "./List";

interface RootProps {
	date: dayjs.Dayjs
};

const Root = function(props: RootProps) {
	const navigate = useNavigate();
	const db = useDatabase();

	useEffect(() => {
		db.user.load().then();
		db.items.loadAll().then();
		db.lists.loadAll().then();
		db.events.loadAll().then();
	}, []);

	useEffect(() => {
		// depending on the existence of a user, route accordingly
		db.user.get("email").then(u => {
			if (u) {
				// FIRST RELEASE: no users
				return;
			}
			else {
				const todayId = dateToDayId(props.date);
				db.lists.has(todayId).then((res: boolean) => {
					if (res) {
						db.lists.get(todayId).then((val) => {
							if (getToday().isSame(props.date, "day") && !(val as ListRubric).planned)
								navigate(paths.PLANNER_PATH);
							else
								navigate(paths.DASHBOARD_PATH)
						});
					} else {
						db.lists.create(props.date);
						if (getToday().isSame(props.date, "day"))
							navigate(paths.PLANNER_PATH);
						else
							navigate(paths.DASHBOARD_PATH);
					}
				});
			}
		});
	}, []);

	const log = () => {
        console.log("l", db.lists.data);
        console.log("i", db.items.data);
        console.log("e", db.events.data);
        console.log("u", db.user.data);
    }

    // debugging
    useHotkeys([
        ['R', log]
    ]);

	return <div></div>
}

const App = function() {
	// overall App state should be stored in this functional component
	const [date, setDate] = useState<dayjs.Dayjs>(getToday());

	const router = createMemoryRouter([
		{
			path: paths.ROOT_PATH,
			element: <Root date={date}/>
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
		>
			<RouterProvider router={router} />
		</MantineProvider>
	);
}

export default App;
