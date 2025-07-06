export interface Unit {
    UnitID: number;
    UnitName: string;
    UnitDescription: string;
    DefaultUnit: string;
}

export type Item = {
    ItemID: number;
    ItemName: string;
    ItemDescription: string;
    UnitID: number;
    IsBase: boolean;
};

export type Building = {
    BuildingID: number;
    BuildingName: string;
    BuildingDescription: string;
    CrewRequirement: number;
    ConstructionCosts: Array<BuildingConstructionCost>;
};

export type BuildingConstructionCost = {
    ItemID: number;
    Amount: number;
};

export type Recipe = {
    RecipeID: number;
    RecipeName: string;
    RecipeDescription: string;
    Power: number;
    Water: number;
    Time: number;
    BuildingID: number;
    Inputs: Array<RecipeItem>;
    Outputs: Array<RecipeItem>;
};

export type RecipeItem = {
    ItemID: number;
    Amount: number;
};
