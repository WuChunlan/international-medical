package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.EntityMedia;
import com.intlmedical.entity.ProductVariant;
import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.mapper.EntityMediaMapper;
import com.intlmedical.mapper.ProductVariantMapper;
import com.intlmedical.mapper.SpecialProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SpecialProductService {

    private final SpecialProductMapper productMapper;
    private final ProductVariantMapper variantMapper;
    private final EntityMediaMapper entityMediaMapper;

    public List<SpecialProduct> listActive() {
        return productMapper.selectList(
            new LambdaQueryWrapper<SpecialProduct>()
                .eq(SpecialProduct::getIsActive, 1)
                .orderByAsc(SpecialProduct::getSortOrder)
        );
    }

    public Map<String, Object> getDetail(Long id) {
        SpecialProduct product = productMapper.selectById(id);
        List<ProductVariant> variants = variantMapper.selectList(
            new LambdaQueryWrapper<ProductVariant>()
                .eq(ProductVariant::getProductId, id)
                .eq(ProductVariant::getIsActive, 1)
                .orderByAsc(ProductVariant::getSortOrder)
        );
        List<EntityMedia> mediaList = entityMediaMapper.selectList(
            new LambdaQueryWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, "product")
                .eq(EntityMedia::getEntityId, id)
                .orderByAsc(EntityMedia::getSortOrder)
        );
        Map<String, Object> result = new HashMap<>();
        result.put("product", product);
        result.put("variants", variants);
        result.put("mediaList", mediaList);
        return result;
    }
}
