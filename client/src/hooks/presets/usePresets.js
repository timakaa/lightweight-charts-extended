import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

// Fetch presets
const fetchPresets = async (page = 1, pageSize = 50, search = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await fetch(`${API_BASE_URL}/presets?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch presets");
  }
  return response.json();
};

// Create preset
const createPreset = async (presetData) => {
  const response = await fetch(`${API_BASE_URL}/presets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(presetData),
  });
  if (!response.ok) {
    throw new Error("Failed to create preset");
  }
  return response.json();
};

// Delete preset
const deletePreset = async (presetId) => {
  const response = await fetch(`${API_BASE_URL}/presets/${presetId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete preset");
  }
  return response.json();
};

// Hook for fetching presets
export const usePresets = (page = 1, pageSize = 50, search = "") => {
  return useQuery({
    queryKey: ["presets", page, pageSize, search],
    queryFn: () => fetchPresets(page, pageSize, search),
    staleTime: 30000, // 30 seconds
  });
};

// Hook for creating preset
export const useCreatePreset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
};

// Hook for deleting preset
export const useDeletePreset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
};
