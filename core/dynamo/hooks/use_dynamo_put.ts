import {
  IAddOrUpdatePlan,
  addOrUpdatePlan,
} from "../../meal_plan/meal_plan_utilities";
import { IMealPlan } from "../../types/meal_plan";
import {
  useUpdateMealPlan,
  getMealPlanQueryKey,
} from "../../../client/hooks";
import { useQueryClient } from "@tanstack/react-query";


const useMutateMealPlanInCache = () => {
  const queryClient = useQueryClient();
  const mealPlanKey = getMealPlanQueryKey();

  return (newMealPlan: IMealPlan) => {
    const previousMealPlan = queryClient.getQueryData(mealPlanKey);

    queryClient.setQueryData(mealPlanKey, newMealPlan);

    return {
      undo: () => {
        queryClient.setQueryData(mealPlanKey, previousMealPlan)
      },
    };
  };
};

export const usePutMealPlanToDynamo = () => {
  const mutate = useMutateMealPlanInCache();
  const queryClient = useQueryClient();
  const mealPlanKey = getMealPlanQueryKey();

  const updateMealPlan = useUpdateMealPlan();

  return {
    ...updateMealPlan,
    mutate: (update: IAddOrUpdatePlan) => {
      const currentMealPlan = queryClient.getQueryData(mealPlanKey) as IMealPlan | undefined;
      if (!currentMealPlan || !Array.isArray(currentMealPlan)) throw new Error('Cannot modify empty meal plan')
      const updatedMealPlan = addOrUpdatePlan(currentMealPlan, update);
      mutate(updatedMealPlan);
      updateMealPlan.mutate(updatedMealPlan);
    },
    mutatePlan: (newMealPlan: IMealPlan) => {
      mutate(newMealPlan);
      updateMealPlan.mutate(newMealPlan);
    },
  };
};
