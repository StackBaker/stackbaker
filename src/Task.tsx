import { Draggable } from "@hello-pangea/dnd";
import { createStyles, Card, Text } from "@mantine/core";

import type { Id } from "./globals";

const useStyles = createStyles((theme) => ({
    task: {
        width: "250px",
        height: "84px"
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
                        ref={provided.innerRef}
                        withBorder
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                    >
                        <Card.Section>
                            <Text>{props.content}</Text>
                        </Card.Section>
                    </Card>
                )
            }
        </Draggable>
    );
}

export default Task;
