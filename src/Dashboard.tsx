import { createStyles, MantineTheme } from "@mantine/core";
import { useNavigate } from "react-router-dom";

const useStyles = createStyles((theme: MantineTheme) => {
    return ({
        wrapper: {
            display: "flex",
            flexDirection: "column"
        }
    });
});

function Dashboard() {
    const { classes } = useStyles();
    const navigate = useNavigate();
    return (
        <div className={classes.wrapper}>
            Hi
            <button onClick={() => navigate("/")}>Click</button>
        </div>
    );
}

export default Dashboard;