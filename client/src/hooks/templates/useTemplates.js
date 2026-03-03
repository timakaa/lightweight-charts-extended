import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@config/api";

// Fetch templates (list without theme_data)
const fetchTemplates = async (page = 1, pageSize = 10, search = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await fetch(`${API_BASE_URL}/templates?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }
  return response.json();
};

// Fetch single template (with full theme_data)
const fetchTemplate = async (templateId) => {
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch template");
  }
  return response.json();
};

// Create template
const createTemplate = async (templateData) => {
  const response = await fetch(`${API_BASE_URL}/templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(templateData),
  });
  if (!response.ok) {
    const error = await response.json();
    const err = new Error(error.detail || "Failed to create template");
    err.status = response.status;
    err.detail = error.detail;
    throw err;
  }
  return response.json();
};

// Update template
const updateTemplate = async ({ templateId, templateData }) => {
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(templateData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update template");
  }
  return response.json();
};

// Delete template
const deleteTemplate = async (templateId) => {
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete template");
  }
  return response.json();
};

// Hook for fetching templates list
export const useTemplates = (page = 1, pageSize = 10, search = "") => {
  return useQuery({
    queryKey: ["templates", page, pageSize, search],
    queryFn: () => fetchTemplates(page, pageSize, search),
    staleTime: 30000, // 30 seconds
  });
};

// Hook for fetching single template
export const useTemplate = (templateId) => {
  return useQuery({
    queryKey: ["template", templateId],
    queryFn: () => fetchTemplate(templateId),
    enabled: !!templateId,
    staleTime: 60000, // 1 minute
  });
};

// Hook for creating template
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};

// Hook for updating template
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (data, variables) => {
      // Invalidate the templates list
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      // Invalidate the specific template that was updated
      queryClient.invalidateQueries({
        queryKey: ["template", variables.templateId],
      });
      // Also remove it from cache to force refetch
      queryClient.removeQueries({
        queryKey: ["template", variables.templateId],
      });
    },
  });
};

// Hook for deleting template
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};
