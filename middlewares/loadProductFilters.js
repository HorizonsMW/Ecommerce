// middlewares/loadProductFilters.js
const Product = require('../models/productModel');

const loadProductFilters = async (req, res, next) => {
    try {
        // Fetch distinct values AND counts in parallel
        const [
            categories, brands, colors,
            categoryCounts, brandCounts, colorCounts,
            priceStats
        ] = await Promise.all([
            // Distinct values
            Product.distinct('category'),
            Product.distinct('brand'),
            Product.distinct('color'),
            
            // Counts for each distinct value
            Product.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Product.aggregate([
                { $group: { _id: '$brand', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Product.aggregate([
                { $group: { _id: '$color', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            
            // Price stats for dynamic ranges
            Product.aggregate([{
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }])
        ]);
        
        // Convert counts arrays to lookup objects: { "Smartphones": 3, "Laptops": 2 }
        const countLookup = (arr) => 
            arr.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
        
        const minPrice = priceStats[0]?.minPrice || 0;
        const maxPrice = priceStats[0]?.maxPrice || 10000;
        
        res.locals.filters = {
            categories: categories.sort().map(cat => ({
                name: cat,
                count: countLookup(categoryCounts)[cat] || 0
            })),
            brands: brands.sort().map(brand => ({
                name: brand,
                count: countLookup(brandCounts)[brand] || 0
            })),
            colors: colors.sort().map(color => ({
                name: color,
                count: countLookup(colorCounts)[color] || 0
            })),
            priceRanges: generateDynamicPriceRanges(minPrice, maxPrice),
            priceStats: { min: minPrice, max: maxPrice }
        };
        
        next();
    } catch (error) {
        console.error('Filter loading error:', error);
        res.locals.filters = { categories: [], brands: [], colors: [], priceRanges: [] };
        next();
    }
};

function generateDynamicPriceRanges(min, max) {
    const ranges = [];
    if (min < 500) ranges.push({ label: 'Under $500', value: '0-500', min: 0, max: 499.99, count: 0 });
    
    let start = Math.max(500, Math.floor(min / 500) * 500);
    while (start < max) {
        const end = start + 499.99;
        if (end >= max) {
            ranges.push({ label: `$${start.toLocaleString()}+`, value: `${start}+`, min: start, max: Infinity, count: 0 });
            break;
        }
        ranges.push({ 
            label: `$${start.toLocaleString()} - $${(start + 499).toLocaleString()}`, 
            value: `${start}-${start + 499}`,
            min: start,
            max: start + 499,
            count: 0
        });
        start += 500;
    }
    return ranges;
}

module.exports = loadProductFilters;