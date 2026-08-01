package edu.virginia.quickwork.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Tunables for the money rules, bound from the {@code quickwork.*} config block. */
@Component
@ConfigurationProperties(prefix = "quickwork")
public class QuickWorkProperties {

    private BigDecimal platformFeeRate = new BigDecimal("0.10");
    private int autoReleaseHours = 48;
    private boolean seedDemoData = true;

    public BigDecimal getPlatformFeeRate() { return platformFeeRate; }
    public void setPlatformFeeRate(BigDecimal platformFeeRate) { this.platformFeeRate = platformFeeRate; }

    public int getAutoReleaseHours() { return autoReleaseHours; }
    public void setAutoReleaseHours(int autoReleaseHours) { this.autoReleaseHours = autoReleaseHours; }

    public boolean isSeedDemoData() { return seedDemoData; }
    public void setSeedDemoData(boolean seedDemoData) { this.seedDemoData = seedDemoData; }
}
