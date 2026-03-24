import { Category, categoryLabels } from '@/data/vocabulary';

interface CategoryFilterProps {
  selected: Category | 'all';
  onSelect: (cat: Category | 'all') => void;
}

const categoryColorMap: Record<Category, string> = {
  everyday: 'bg-category-everyday/10 text-category-everyday border-category-everyday/30 data-[active=true]:bg-category-everyday data-[active=true]:text-primary-foreground',
  verbs: 'bg-category-verbs/10 text-category-verbs border-category-verbs/30 data-[active=true]:bg-category-verbs data-[active=true]:text-primary-foreground',
  adjectives: 'bg-category-adjectives/10 text-category-adjectives border-category-adjectives/30 data-[active=true]:bg-category-adjectives data-[active=true]:text-primary-foreground',
  nouns: 'bg-category-nouns/10 text-category-nouns border-category-nouns/30 data-[active=true]:bg-category-nouns data-[active=true]:text-primary-foreground',
  sentences: 'bg-category-sentences/10 text-category-sentences border-category-sentences/30 data-[active=true]:bg-category-sentences data-[active=true]:text-primary-foreground',
  technical: 'bg-category-technical/10 text-category-technical border-category-technical/30 data-[active=true]:bg-category-technical data-[active=true]:text-primary-foreground',
};

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        data-active={selected === 'all'}
        onClick={() => onSelect('all')}
        className="px-4 py-2 rounded-full text-sm font-medium border transition-all
          bg-muted text-muted-foreground border-border
          data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:border-foreground"
      >
        📚 Все
      </button>
      {(Object.keys(categoryLabels) as Category[]).map((cat) => (
        <button
          key={cat}
          data-active={selected === cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${categoryColorMap[cat]}`}
        >
          {categoryLabels[cat].icon} {categoryLabels[cat].ru}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
