package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.mapper.SpecialProductMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final SpecialProductMapper specialProductMapper;

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
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody SpecialProduct product) {
        product.setId(id);
        specialProductMapper.updateById(product);
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
}
