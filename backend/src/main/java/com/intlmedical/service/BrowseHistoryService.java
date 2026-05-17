package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.BrowseHistory;
import com.intlmedical.entity.Hospital;
import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.mapper.BrowseHistoryMapper;
import com.intlmedical.mapper.HospitalMapper;
import com.intlmedical.mapper.SpecialProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrowseHistoryService {

    private final BrowseHistoryMapper historyMapper;
    private final HospitalMapper hospitalMapper;
    private final SpecialProductMapper productMapper;

    public List<BrowseHistory> listByUser(Long userId) {
        return historyMapper.selectList(
            new LambdaQueryWrapper<BrowseHistory>()
                .eq(BrowseHistory::getUserId, userId)
                .orderByDesc(BrowseHistory::getCreatedAt)
                .last("LIMIT 50")
        );
    }

    public void record(Long userId, String targetType, Long targetId) {
        BrowseHistory h = new BrowseHistory();
        h.setUserId(userId);
        h.setTargetType(targetType);
        h.setTargetId(targetId);

        if ("hospital".equals(targetType)) {
            Hospital hospital = hospitalMapper.selectById(targetId);
            if (hospital != null) {
                h.setTargetNameZh(hospital.getNameZh());
                h.setTargetNameEn(hospital.getNameEn());
            }
        } else if ("product".equals(targetType)) {
            SpecialProduct product = productMapper.selectById(targetId);
            if (product != null) {
                h.setTargetNameZh(product.getNameZh());
                h.setTargetNameEn(product.getNameEn());
            }
        }

        if (h.getTargetNameZh() != null) {
            historyMapper.insert(h);
        }
    }
}
