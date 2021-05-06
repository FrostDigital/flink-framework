interface Offer {
    /**
     * @TJS-format uuid
     */
    id: string;
    // customer: ?
    // location: coordinates
    date: Date;
    // vessel: ?
    // products: [product]
    transportCost: number;
    pumpCost: number;
    mtsPrice: number;
    totalPrice: number;
}

export default Offer;

