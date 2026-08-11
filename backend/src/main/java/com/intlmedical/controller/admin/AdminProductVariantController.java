package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.ProductVariant;
import com.intlmedical.mapper.ProductVariantMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products/{productId}/variants")
@RequiredArgsConstructor
public class AdminProductVariantController {

    private final ProductVariantMapper variantMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<List<ProductVariant>> list(@PathVariable Long productId) {
        List<ProductVariant> list = variantMapper.selectList(
            new LambdaQueryWrapper<ProductVariant>()
                .eq(ProductVariant::getProductId, productId)
                .orderByAsc(ProductVariant::getSortOrder)
        );
        return Result.ok(list);
    }

    @PostMapping
    public Result<Void> create(@PathVariable Long productId, @RequestBody ProductVariant variant) {
        variant.setProductId(productId);
        variantMapper.insert(variant);
        contentTranslationService.autoTranslateEntityAsync("variant", variant.getId(), Map.of(
            "name", nullSafe(variant.getNameZh()),
            "desc", nullSafe(variant.getDescZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long productId, @PathVariable Long id,
                               @RequestBody ProductVariant variant) {
        variant.setId(id);
        variant.setProductId(productId);
        variantMapper.updateById(variant);
        contentTranslationService.autoTranslateEntityAsync("variant", id, Map.of(
            "name", nullSafe(variant.getNameZh()),
            "desc", nullSafe(variant.getDescZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long productId, @PathVariable Long id) {
        variantMapper.update(null,
            new LambdaUpdateWrapper<ProductVariant>()
                .eq(ProductVariant::getId, id)
                .eq(ProductVariant::getProductId, productId)
                .set(ProductVariant::getIsActive, 0)
        );
        return Result.ok();
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }
}
