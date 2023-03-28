import { Draggable } from "@hello-pangea/dnd";
import { Card, createStyles } from "@mantine/core";

import type { Id } from "./globals";

const useStyles = createStyles((theme) => ({
    task: {
        width: "84px"
    }
}));

export interface TaskRubric {
    taskId: Id,
    content: string,
    complete: boolean
};

interface TaskProps extends TaskRubric {
    index: number
};

const Task = function(props: TaskProps) {
    const { classes } = useStyles();

    return (
        <Draggable
            draggableId={props.taskId}
            index={props.index}
        >
            {
                (provided) => (
                    <Card
                        className={classes.task}
                    >
                        Hi there.
                    </Card>
                )
            }
        </Draggable>
    );
}

export default Task;
