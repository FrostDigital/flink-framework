interface Order {
    /**
     * @TJS-format uuid
     */
    id: string;
    /**
     * @TJS-format uuid
     */
    createdBy: string;
    /**
     * @TJS-format uuid
     */
    confirmedBy: string;
    /**
     * @TJS-format uuid
     */
    assignedTo: string;
    // offer?: { offer }
    status: string;
    // report: ?
    workStart: Date;
    workEnd: Date;
    notes: string;
}

export default Order;

