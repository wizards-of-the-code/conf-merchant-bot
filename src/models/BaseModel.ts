import mongoose, { Model, Document } from 'mongoose';

interface BaseModel {
    _id: string;
}

export default abstract class AbstractModel<T extends BaseModel> {
    private model: Model<T & Document>;

    constructor(model: Model<T & Document>) {
        this.model = model;
    }

    async create(data: T): Promise<T> {
        const createdData = await this.model.create(data);
        return createdData.toObject();
    }

    async read(id: string): Promise<T | null> {
        const data = await this.model.findById(id).lean().exec();
        return data as T | null;
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        const updatedData = await this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();
        return updatedData as T | null;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id).exec();
        return result !== null;
    }
}