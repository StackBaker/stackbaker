import type { Id } from "./globals"

export interface TaskRubric {
    taskId: Id,
    content: string,
    complete: boolean
};

interface TaskProps extends TaskRubric {

};

const Task = function(props: TaskProps) {
    return <div></div>
}

export default Task;
