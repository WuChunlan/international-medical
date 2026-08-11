package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.mapper.SpecialProductMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final SpecialProductMapper specialProductMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<IPage<SpecialProduct>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<SpecialProduct> result = specialProductMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<SpecialProduct>().orderByAsc(SpecialProduct::getSortOrder)
        );
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody SpecialProduct product) {
        specialProductMapper.insert(product);
        contentTranslationService.autoTranslateEntityAsync("product", product.getId(), Map.of(
            "name", nullSafe(product.getNameZh()),
            "summary", nullSafe(product.getSummaryZh()),
            "detail", nullSafe(product.getDetailZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody SpecialProduct product) {
        product.setId(id);
        specialProductMapper.updateById(product);
        contentTranslationService.autoTranslateEntityAsync("product", id, Map.of(
            "name", nullSafe(product.getNameZh()),
            "summary", nullSafe(product.getSummaryZh()),
            "detail", nullSafe(product.getDetailZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        specialProductMapper.update(null,
            new LambdaUpdateWrapper<SpecialProduct>()
                .eq(SpecialProduct::getId, id)
                .set(SpecialProduct::getIsActive, 0)
        );
        return Result.ok();
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }
}
