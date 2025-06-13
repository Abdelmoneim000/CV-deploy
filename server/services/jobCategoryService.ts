import { storage } from '../storage';
import { 
  type JobCategory, 
  type InsertJobCategory,
  insertJobCategorySchema 
} from '@shared/schema';

interface CategoryWithStats extends JobCategory {
  jobCount: number;
  activeJobCount: number;
}

export class JobCategoryService {
  // Get all active categories
  async getCategories(): Promise<JobCategory[]> {
    return await storage.getJobCategories();
  }

  // Get categories with job statistics
  async getCategoriesWithStats(): Promise<CategoryWithStats[]> {
    const categories = await storage.getJobCategories();
    const categoriesWithStats: CategoryWithStats[] = [];

    for (const category of categories) {
      const allJobs = await storage.searchJobs({ categoryId: category.id }, 1, 1000);
      const activeJobs = await storage.searchJobs({ 
        categoryId: category.id,
        status: 'published' 
      }, 1, 1000);

      categoriesWithStats.push({
        ...category,
        jobCount: allJobs.total,
        activeJobCount: activeJobs.total
      });
    }

    return categoriesWithStats;
  }

  // Create a new category (admin only)
  async createCategory(categoryData: InsertJobCategory): Promise<JobCategory> {
    const validation = insertJobCategorySchema.safeParse(categoryData);
    if (!validation.success) {
      throw new Error(`Invalid category data: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    return await storage.createJobCategory(validation.data);
  }

  // Update category
  async updateCategory(id: number, updateData: Partial<JobCategory>): Promise<JobCategory> {
    const category = await storage.getJobCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    const updatedCategory = await storage.updateJobCategory(id, updateData);
    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    return updatedCategory;
  }

  // Delete category (only if no jobs are using it)
  async deleteCategory(id: number): Promise<boolean> {
    const category = await storage.getJobCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if any jobs are using this category
    const jobsInCategory = await storage.searchJobs({ categoryId: id }, 1, 1);
    if (jobsInCategory.total > 0) {
      throw new Error('Cannot delete category that has associated jobs');
    }

    return await storage.deleteJobCategory(id);
  }

  // Initialize default categories
  async initializeDefaultCategories(): Promise<void> {
    const existingCategories = await storage.getJobCategories();
    if (existingCategories.length > 0) {
      return; // Categories already exist
    }

    const defaultCategories: InsertJobCategory[] = [
      { name: 'Technology', description: 'Software development, IT, and tech roles' },
      { name: 'Marketing', description: 'Digital marketing, content, and advertising' },
      { name: 'Sales', description: 'Sales representatives, account managers, and business development' },
      { name: 'Design', description: 'UI/UX design, graphic design, and creative roles' },
      { name: 'Human Resources', description: 'HR, recruiting, and people operations' },
      { name: 'Finance', description: 'Accounting, financial analysis, and investment' },
      { name: 'Customer Service', description: 'Support, success, and customer-facing roles' },
      { name: 'Operations', description: 'Operations management, logistics, and supply chain' },
      { name: 'Healthcare', description: 'Medical, nursing, and healthcare administration' },
      { name: 'Education', description: 'Teaching, training, and educational administration' },
      { name: 'Engineering', description: 'Mechanical, electrical, civil, and other engineering' },
      { name: 'Legal', description: 'Legal counsel, paralegal, and compliance roles' },
      { name: 'Manufacturing', description: 'Production, quality control, and manufacturing' },
      { name: 'Retail', description: 'Retail sales, management, and merchandising' },
      { name: 'Hospitality', description: 'Hotels, restaurants, and tourism' },
      { name: 'Other', description: 'All other job categories' }
    ];

    for (const category of defaultCategories) {
      await storage.createJobCategory(category);
    }

    console.log('Default job categories initialized');
  }
}

// Create and export the service instance
export const jobCategoryService = new JobCategoryService();