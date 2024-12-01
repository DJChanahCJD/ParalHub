import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { getTags } from '@/api/common'
import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// 修改筛选选项接口
interface FilterOptions {
  tags: string[]
  sortField: string
  sortOrder: 'ascend' | 'descend'
}

// 定义组件属性接口
interface CaseFiltersProps {
  filters: FilterOptions
  onFilterChange: (key: keyof FilterOptions, value: string[] | string) => void
  onSortChange: (value: string) => void
}

export function CaseFilters({ filters, onFilterChange, onSortChange }: CaseFiltersProps) {
  const [tagOptions, setTagOptions] = useState<Option[]>([])

  useEffect(() => {
    getTags().then((res) => {
      if (res.data) {
        setTagOptions(res.data.map(tag => ({
          _id: tag.name,
          name: tag.name,
        })))
      }
    })
  }, [])

  return (
    <Card className="bg-[hsl(var(--card))] shadow-sm">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 标签多选筛选 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <MultiSelect
            options={tagOptions}
            selected={filters.tags}
            onChange={(value) => onFilterChange('tags', value)}
            placeholder="Select tags..."
            emptyText="No tags found"
            className="hover:border-[hsl(var(--primary))] focus-within:border-[hsl(var(--primary))]"
          />
        </div>

        {/* 排序方式 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sort by</label>
          <Select
            value={`${filters.sortField}-${filters.sortOrder}`}
            onValueChange={onSortChange}
          >
            <SelectTrigger className="hover:border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="updatedAt-descend"
                className="hover:bg-[hsl(var(--primary))] hover:text-primary-foreground focus:bg-[hsl(var(--primary))] focus:text-primary-foreground"
              >
                Most Recent
              </SelectItem>
              <SelectItem
                value="stars-descend"
                className="hover:bg-[hsl(var(--primary))] hover:text-primary-foreground focus:bg-[hsl(var(--primary))] focus:text-primary-foreground"
              >
                Most Starred
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}