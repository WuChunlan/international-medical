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
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    public List<SpecialProduct> listActive() {
        return listActive("zh");
    }

    public List<SpecialProduct> listActive(String lang) {
        List<SpecialProduct> list = productMapper.selectList(
            new LambdaQueryWrapper<SpecialProduct>()
                .eq(SpecialProduct::getIsActive, 1)
                .eq(SpecialProduct::getAuditStatus, "approved")
                .orderByAsc(SpecialProduct::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            list.forEach(p -> p.setTranslations(
                translationService.getAll("product", p.getId(), lang)
            ));
        }
        return list;
    }

    public Map<String, Object> getDetail(Long id) {
        return getDetail(id, "zh");
    }

    public Map<String, Object> getDetail(Long id, String lang) {
        SpecialProduct product = productMapper.selectById(id);
        if (product != null && !BUILTIN_LANGS.contains(lang)) {
            product.setTranslations(translationService.getAll("product", id, lang));
        }
        List<ProductVariant> variants = variantMapper.selectList(
            new LambdaQueryWrapper<ProductVariant>()
                .eq(ProductVariant::getProductId, id)
                .eq(ProductVariant::getIsActive, 1)
                .orderByAsc(ProductVariant::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            variants.forEach(v -> v.setTranslations(translationService.getAll("variant", v.getId(), lang)));
        }
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
