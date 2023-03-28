import { Draggable } from "@hello-pangea/dnd";
import { createStyles, Card, Text } from "@mantine/core";

import type { Id } from "./globals";

const useStyles = createStyles((theme) => ({
    item: {
        width: "250px",
        height: "84px"
    }
}));

// TODO: add location to tasks?
// TODO: finish the Task UI
// TODO: implement the add button to the List and keyboard shortcuts
export interface ItemRubric {
    itemId: Id,
    content: string,
    complete: boolean,
    location?: string
};

interface ItemProps extends ItemRubric {
    index: number
};

const Item = function(props: ItemProps) {
    const { classes } = useStyles();

    return (
        <Draggable
            draggableId={props.itemId}
            index={props.index}
        >
            {
                (provided) => (
                    <Card
                        className={classes.item}
                        ref={provided.innerRef}
                        withBorder
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                    >
                        <Card.Section>
                            <Text>{props.content}</Text>
                        </Card.Section>
                        {/* location, pretty formatting, check mark for complete, text wrap */}
                    </Card>
                )
            }
        </Draggable>
    );
}

export default Item;
