import mongoose, { Model, Document } from 'mongoose';
import AbstractModel from '../models/BaseModel';

class DBManager{

    model: AbstractModel<T & Document>;

    constructor(){
    }
}
