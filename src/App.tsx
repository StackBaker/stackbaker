import dayjs from "dayjs";
import { useEffect, useState } from "react";
import useDatabase from "./Persistence/useDatabase";
import { useNavigate, createMemoryRouter, RouterProvider, Link } from "react-router-dom";
import { Button, MantineProvider } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api";
import { fetch as tauriFetch } from "@tauri-apps/api/http";

import "./App.css";
import "./styles.css";
import * as paths from "./paths";
import Dashboard from "./Dashboard/Dashboard";
import Planner from "./Planner/Planner";
import LoginSequence from "./Authentication/LoginSequence";
import { dateToDayId, getToday } from "./dateutils";
import { ListRubric } from "./List";
import { UserRubric } from "./Persistence/useUserDB";

type baseEmailResType = { data: { email: string } };
interface emailResType extends baseEmailResType {};

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

	// TODO: if can't find the user
	// move to the Login View
	// the login view will have a few stages
	// - stage 1: login with google 
	// - stage 2: accept an authorization code or go back -> save this to the database
	// - stage 3: once the auth code is saved to the db, reload to the root
	// 				then use the auth code to handle calendar events

	useEffect(() => {
		// depending on the existence of a user, route accordingly
		db.user.get("email").then(u => {
			const accessTokenExpiryDate = db.user.data.authData?.expiryDate;
			if (!u && accessTokenExpiryDate !== undefined) {
				// no email, and google was connected
				// get the user's email
				const expiryDate = dayjs(accessTokenExpiryDate!);
				// using the refresh token, refresh the access token
				if (dayjs().isAfter(expiryDate)) {
					invoke("exchange_refresh_for_access_token", { refreshToken: db.user.data.authData!.refreshToken }).then(r => {
						let res = r as { expires_in: number, access_token: string };
						const accessToken = res.access_token;
						const expiryDate = dayjs().add(Math.max(res.expires_in - 10, 0), "seconds").format();
		
						if (!accessToken || !expiryDate) {
							console.log("no access token or expiry", accessToken, expiryDate)
							return;
						}
		
						db.user.set("authData", {
							refreshToken: db.user.data.authData!.refreshToken,
							accessToken,
							expiryDate
						});
					});
				}

				// get the user's email
				tauriFetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
					method: "GET",
					headers: {
						"Authorization": `Bearer ${db.user.data.authData!.accessToken}`
					}
				}).then(r => {
					let res = r as emailResType;
					db.user.set("email", res.data.email);
				});

				// TODO: we can get the user's email if they have auth data
				// but we might not actually need it
			}

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
		});
	}, [db.user.data]);

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

	return (
		<div></div>
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
