/**
 * 客户关系接口定义
 */
export interface CustomerRelation {
  /**
   * 关联客户ID
   */
  customerId: string;

  /**
   * 与该客户的关系描述
   */
  relation: string;
}
