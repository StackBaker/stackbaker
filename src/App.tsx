import dayjs from "dayjs";
import { useEffect, useState } from "react";
import useDatabase from "./Persistence/useDatabase";
import { useNavigate, createMemoryRouter, RouterProvider, Link } from "react-router-dom";
import { Button, MantineProvider } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api";

import "./App.css";
import "./styles.css";
import * as paths from "./paths";
import Dashboard from "./Dashboard/Dashboard";
import Planner from "./Planner/Planner";
import LoginSequence from "./Authentication/LoginSequence";
import { dateToDayId, getToday } from "./dateutils";
import { ListRubric } from "./List";
import { UserRubric } from "./Persistence/useUserDB";

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
		db.user.get("authcode").then(u => {
			if (!u) {
				navigate(paths.LOGIN_PATH);
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

	// TODO: if can't find the user
	// move to the Login View
	// the login view will have a few stages
	// - stage 1: login with google 
	// - stage 2: accept an authorization code or go back -> save this to the database
	// - stage 3: once the auth code is saved to the db, reload to the root
	// 				then use the auth code to handle calendar events

	const [x, setX] = useState("");
	useEffect(() => {
		// depending on the existence of a user, route accordingly
		db.user.get("email").then(u => {
			if (u) {
				// FIRST RELEASE: no users
				return;
			}
			else {
				db.user.get("autoLoadPlanner").then((alp) => {
					let autoLoadPlanner = alp as boolean;
					const todayId = dateToDayId(props.date);
					db.lists.has(todayId).then((res: boolean) => {
						if (res) {
							db.lists.get(todayId).then((val) => {
								if (getToday().isSame(props.date, "day") && autoLoadPlanner && !(val as ListRubric).planned)
									navigate(paths.PLANNER_PATH);
								else
									navigate(paths.DASHBOARD_PATH);
							});
						} else {
							db.lists.create(props.date);
							if (getToday().isSame(props.date, "day"))
								navigate(paths.PLANNER_PATH);
							else
								navigate(paths.DASHBOARD_PATH);
						}
					});
				});
			}
		});
	}, []);

	useEffect(() => {
		invoke("create_oauth_request_url").then((r) => {
			let res = r as string;
			setX(res);
			console.log(res);
		});
	}, []);

	// const log = () => {
    //     console.log("l", db.lists.data);
    //     console.log("i", db.items.data);
    //     console.log("e", db.events.data);
    //     console.log("u", db.user.data);
    // }

    // // debugging
    // useHotkeys([
    //     ['R', log]
    // ]);

	return (
		<div>

		</div>
	);
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
		},
		{
			path: paths.LOGIN_PATH,
			element: <LoginSequence />
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
